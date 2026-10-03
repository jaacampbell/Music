import base64
import hashlib
import hmac
import ipaddress
import json
import os
import shutil
import socket
import subprocess
import threading
import time
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import cv2
import httpx
import numpy as np
import torch
import torch.nn.functional as torch_f
from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from torchvision.models.segmentation import DeepLabV3_ResNet50_Weights, deeplabv3_resnet50

WAN_ROOT = Path(os.getenv("WAN_ROOT", "/opt/Wan2.2"))
MODEL_DIR = Path(os.getenv("WAN_MODEL_DIR", "/models/Wan2.2-TI2V-5B"))
OUTPUT_DIR = Path(os.getenv("WAN_OUTPUT_DIR", "/data/outputs"))
EDITOR_OUTPUT_DIR = Path(os.getenv("JC_EDITOR_OUTPUT_DIR", "/data/editor-outputs"))
INPUT_DIR = Path(os.getenv("WAN_INPUT_DIR", "/data/inputs"))
PUBLIC_BASE_URL = os.getenv("WAN_PUBLIC_BASE_URL", "").rstrip("/")
API_TOKEN = os.getenv("WAN_API_TOKEN", "")
CAPABILITY_SECRET = os.getenv("JC_EDITOR_SIGNING_SECRET", "") or API_TOKEN
MAX_EDITOR_UPLOAD_BYTES = int(os.getenv("JC_EDITOR_MAX_UPLOAD_BYTES", str(1536 * 1024 * 1024)))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
EDITOR_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
INPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="JC Film Studio GPU Editor", version="2.1.0")
origin_regex = os.getenv(
    "JC_EDITOR_CORS_REGEX",
    r"^https://([a-z0-9-]+--)?jc-film-studio\.netlify\.app$|^http://localhost(:\d+)?$",
)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["authorization", "content-type"],
)
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

jobs: dict[str, dict[str, Any]] = {}
editor_jobs: dict[str, dict[str, Any]] = {}
jobs_lock = threading.Lock()
editor_lock = threading.Lock()
encoder_cache: set[str] | None = None
segmenter = None
segmenter_lock = threading.Lock()


class GenerationRequest(BaseModel):
    model: str = "Wan-AI/Wan2.2-TI2V-5B"
    prompt: str = Field(min_length=1, max_length=8000)
    aspect_ratio: str = "9:16"
    resolution: str = "720p"
    duration_seconds: int = Field(default=5, ge=1, le=5)
    fps: int = 24
    image_url: str | None = None
    reference_urls: list[str] = Field(default_factory=list, max_length=3)
    end_frame_url: str | None = None
    enhance_prompt: bool = True


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        return ""
    return authorization[7:].strip()


def authorize_server(authorization: str | None = Header(default=None)):
    if API_TOKEN and _bearer(authorization) != API_TOKEN:
        raise HTTPException(status_code=401, detail="unauthorized")
    return {"kind": "server", "ops": ["*"], "nonce": "server"}


def _decode_b64url(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def sign_editor_payload(payload: dict[str, Any]) -> str:
    if not CAPABILITY_SECRET:
        raise RuntimeError("editor_capability_secret_missing")
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")).rstrip(b"=").decode("ascii")
    signature = hmac.new(CAPABILITY_SECRET.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode('ascii')}"


def verify_editor_capability(token: str) -> dict[str, Any]:
    if not CAPABILITY_SECRET:
        raise HTTPException(status_code=503, detail="editor_capability_secret_missing")
    try:
        payload_part, signature_part = token.split(".", 1)
        expected = hmac.new(
            CAPABILITY_SECRET.encode("utf-8"),
            payload_part.encode("ascii"),
            hashlib.sha256,
        ).digest()
        supplied = _decode_b64url(signature_part)
        if not hmac.compare_digest(expected, supplied):
            raise ValueError("signature")
        payload = json.loads(_decode_b64url(payload_part))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        if payload.get("v") != 1 or not isinstance(payload.get("ops"), list):
            raise ValueError("payload")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="invalid_or_expired_editor_capability")


def authorize_editor(authorization: str | None = Header(default=None)):
    token = _bearer(authorization)
    if API_TOKEN and token == API_TOKEN:
        return {"kind": "server", "ops": ["*"], "nonce": "server"}
    return verify_editor_capability(token)


def require_op(auth: dict[str, Any], operation: str) -> None:
    ops = auth.get("ops") or []
    if "*" not in ops and operation not in ops:
        raise HTTPException(status_code=403, detail="operation_not_allowed")


def public_url(path: Path) -> str:
    if not PUBLIC_BASE_URL:
        raise RuntimeError("WAN_PUBLIC_BASE_URL is required")
    return f"{PUBLIC_BASE_URL}/outputs/{path.name}"


def validate_public_https(value: str) -> None:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.port:
        raise ValueError("reference_url_must_be_public_https")
    for info in socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM):
        address = ipaddress.ip_address(info[4][0])
        if not address.is_global:
            raise ValueError("reference_url_must_be_public_https")


def download_image(url: str, destination: Path) -> None:
    validate_public_https(url)
    with httpx.stream("GET", url, follow_redirects=False, timeout=30) as response:
        response.raise_for_status()
        content_type = response.headers.get("content-type", "").split(";")[0]
        if not content_type.startswith("image/"):
            raise ValueError("reference_must_be_image")
        total = 0
        with destination.open("wb") as handle:
            for chunk in response.iter_bytes():
                total += len(chunk)
                if total > 12 * 1024 * 1024:
                    raise ValueError("reference_image_too_large")
                handle.write(chunk)


def update_job(job_id: str, **values) -> None:
    with jobs_lock:
        jobs[job_id].update(values)


def update_editor_job(job_id: str, **values) -> None:
    with jobs_lock:
        editor_jobs[job_id].update(values)


def run_generation(job_id: str, request: GenerationRequest) -> None:
    output = OUTPUT_DIR / f"{job_id}.mp4"
    image = INPUT_DIR / f"{job_id}.jpg"
    try:
        update_job(job_id, status="processing")
        command = [
            "python", str(WAN_ROOT / "generate.py"),
            "--task", "ti2v-5B",
            "--size", "704*1280" if request.aspect_ratio == "9:16" else "1280*704",
            "--ckpt_dir", str(MODEL_DIR),
            "--offload_model", "True",
            "--convert_model_dtype",
            "--t5_cpu",
            "--prompt", request.prompt,
            "--save_file", str(output),
        ]
        if request.image_url:
            download_image(request.image_url, image)
            command.extend(["--image", str(image)])
        completed = subprocess.run(command, cwd=WAN_ROOT, text=True, capture_output=True, timeout=3600)
        if completed.returncode != 0:
            detail = (completed.stderr or completed.stdout or "wan_generation_failed")[-2000:]
            raise RuntimeError(detail)
        if not output.exists():
            raise RuntimeError("wan_output_missing")
        update_job(job_id, status="completed", result_url=public_url(output), error=None)
    except Exception as error:
        update_job(job_id, status="failed", error=str(error)[-2000:])
    finally:
        image.unlink(missing_ok=True)


def _run(command: list[str], timeout: int = 7200) -> subprocess.CompletedProcess:
    completed = subprocess.run(command, text=True, capture_output=True, timeout=timeout)
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout or "command_failed")[-4000:])
    return completed


def ffprobe(path: Path) -> dict[str, Any]:
    raw = _run([
        "ffprobe", "-v", "error", "-show_streams", "-show_format",
        "-of", "json", str(path),
    ], timeout=120).stdout
    data = json.loads(raw or "{}")
    streams = data.get("streams") or []
    video = next((s for s in streams if s.get("codec_type") == "video"), {})
    audio = next((s for s in streams if s.get("codec_type") == "audio"), {})
    tags = {}
    tags.update(data.get("format", {}).get("tags") or {})
    tags.update(video.get("tags") or {})
    fps_raw = str(video.get("avg_frame_rate") or video.get("r_frame_rate") or "0/1")
    try:
        num, den = fps_raw.split("/", 1)
        fps = float(num) / max(float(den), 1.0)
    except Exception:
        fps = 0.0
    return {
        "duration": float(data.get("format", {}).get("duration") or video.get("duration") or 0),
        "sizeBytes": int(data.get("format", {}).get("size") or 0),
        "videoCodec": video.get("codec_name"),
        "audioCodec": audio.get("codec_name"),
        "width": int(video.get("width") or 0),
        "height": int(video.get("height") or 0),
        "fps": round(fps, 4),
        "timecode": tags.get("timecode") or tags.get("TIMECODE") or "",
        "colorSpace": video.get("color_space") or "",
        "colorTransfer": video.get("color_transfer") or "",
        "pixelFormat": video.get("pix_fmt") or "",
    }


def ffmpeg_encoders() -> set[str]:
    global encoder_cache
    if encoder_cache is None:
        text = _run(["ffmpeg", "-hide_banner", "-encoders"], timeout=60).stdout
        encoder_cache = {line.split()[1] for line in text.splitlines() if len(line.split()) > 1 and line.lstrip().startswith("V")}
    return encoder_cache


def choose_encoder(preferred: str, fallback: str) -> str:
    try:
        return preferred if preferred in ffmpeg_encoders() else fallback
    except Exception:
        return fallback


def h264_args() -> list[str]:
    enc = choose_encoder("h264_nvenc", "libx264")
    if enc == "h264_nvenc":
        return ["-c:v", enc, "-preset", "p4", "-cq", "21"]
    return ["-c:v", enc, "-preset", "veryfast", "-crf", "20"]


def h265_args() -> list[str]:
    enc = choose_encoder("hevc_nvenc", "libx265")
    if enc == "hevc_nvenc":
        return ["-c:v", enc, "-preset", "p4", "-cq", "22"]
    return ["-c:v", enc, "-preset", "medium", "-crf", "22"]


def scale_filter(resolution: str) -> str | None:
    if resolution == "720":
        return "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2"
    if resolution == "1080":
        return "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2"
    if resolution == "2160":
        return "scale=w='min(3840,iw)':h='min(2160,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2"
    return None


def transcode_proxy(source: Path, output: Path, options: dict[str, Any]) -> dict[str, Any]:
    height = str(options.get("height") or "720")
    vf = scale_filter("1080" if height == "1080" else "720")
    command = ["ffmpeg", "-y", "-i", str(source), "-map", "0:v:0", "-map", "0:a?"]
    if vf:
        command += ["-vf", vf]
    command += h264_args() + [
        "-pix_fmt", "yuv420p", "-b:v", "2M", "-maxrate", "3M", "-bufsize", "6M",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(output),
    ]
    _run(command)
    return {"profile": "editing-proxy", "codec": "h264", "height": int(height), "backend": command[command.index("-c:v") + 1]}


def render_master(source: Path, output: Path, options: dict[str, Any]) -> dict[str, Any]:
    codec = str(options.get("codec") or "h264")
    resolution = str(options.get("resolution") or "source")
    fps = int(options.get("fps") or 0)
    command = ["ffmpeg", "-y", "-i", str(source), "-map", "0:v:0", "-map", "0:a?"]
    vf = scale_filter(resolution)
    if vf:
        command += ["-vf", vf]
    if fps in (24, 25, 30, 50, 60):
        command += ["-r", str(fps)]
    if codec == "prores_422_hq":
        command += ["-c:v", "prores_ks", "-profile:v", "3", "-pix_fmt", "yuv422p10le", "-c:a", "pcm_s24le"]
    elif codec == "dnxhr_hq":
        command += ["-c:v", "dnxhd", "-profile:v", "dnxhr_hq", "-pix_fmt", "yuv422p", "-c:a", "pcm_s24le"]
    elif codec == "h265":
        command += h265_args() + ["-pix_fmt", "yuv420p10le", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart"]
    else:
        codec = "h264"
        command += h264_args() + ["-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart"]
    command.append(str(output))
    _run(command)
    return {"profile": "native-master", "codec": codec, "resolution": resolution, "fps": fps or "source", "backend": command[command.index("-c:v") + 1]}


def _video_writer(path: Path, fps: float, size: tuple[int, int], color: bool = True):
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(path), fourcc, fps, size, color)
    if not writer.isOpened():
        raise RuntimeError("opencv_video_writer_unavailable")
    return writer


def _mux_audio(video_only: Path, source: Path, output: Path) -> None:
    _run([
        "ffmpeg", "-y", "-i", str(video_only), "-i", str(source),
        "-map", "0:v:0", "-map", "1:a?", "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(output),
    ])


def dense_optical_flow(source: Path, output: Path, options: dict[str, Any]) -> dict[str, Any]:
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise RuntimeError("video_decode_failed")
    src_fps = float(cap.get(cv2.CAP_PROP_FPS) or 24.0)
    target_fps = float(options.get("target_fps") or min(60.0, src_fps * 2.0))
    target_fps = max(src_fps, min(60.0, target_fps))
    ratio = max(1, min(4, int(round(target_fps / max(src_fps, 1.0)))))
    out_fps = src_fps * ratio
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    max_seconds = float(options.get("max_seconds") or 45.0)
    max_frames = max(2, int(src_fps * max_seconds))
    temp = EDITOR_OUTPUT_DIR / f"{output.stem}-flow-temp.mp4"
    writer = _video_writer(temp, out_fps, (width, height))
    ok, previous = cap.read()
    if not ok:
        cap.release()
        writer.release()
        raise RuntimeError("video_has_no_frames")
    processed = 0
    while processed < max_frames:
        ok, current = cap.read()
        if not ok:
            break
        writer.write(previous)
        prev_gray = cv2.cvtColor(previous, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(current, cv2.COLOR_BGR2GRAY)
        flow_forward = cv2.calcOpticalFlowFarneback(prev_gray, curr_gray, None, .5, 3, 15, 3, 5, 1.2, 0)
        flow_backward = cv2.calcOpticalFlowFarneback(curr_gray, prev_gray, None, .5, 3, 15, 3, 5, 1.2, 0)
        grid_x, grid_y = np.meshgrid(np.arange(width, dtype=np.float32), np.arange(height, dtype=np.float32))
        for step in range(1, ratio):
            t = step / ratio
            prev_map_x = grid_x - flow_forward[..., 0] * t
            prev_map_y = grid_y - flow_forward[..., 1] * t
            curr_map_x = grid_x - flow_backward[..., 0] * (1.0 - t)
            curr_map_y = grid_y - flow_backward[..., 1] * (1.0 - t)
            a = cv2.remap(previous, prev_map_x, prev_map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            b = cv2.remap(current, curr_map_x, curr_map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            writer.write(cv2.addWeighted(a, 1.0 - t, b, t, 0))
        previous = current
        processed += 1
    writer.write(previous)
    cap.release()
    writer.release()
    _mux_audio(temp, source, output)
    temp.unlink(missing_ok=True)
    return {
        "profile": "dense-optical-flow",
        "backend": "opencv-farneback-dense",
        "sourceFps": round(src_fps, 3),
        "targetFps": round(out_fps, 3),
        "processedFrames": processed + 1,
    }


def get_segmenter():
    global segmenter
    with segmenter_lock:
        if segmenter is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            weights = DeepLabV3_ResNet50_Weights.DEFAULT
            segmenter = deeplabv3_resnet50(weights=weights).eval().to(device)
            segmenter._jc_device = device
        return segmenter


def person_mask(frame: np.ndarray, threshold: float = .45) -> np.ndarray:
    model = get_segmenter()
    device = model._jc_device
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    tensor = torch.from_numpy(rgb).permute(2, 0, 1).float().div(255.0).unsqueeze(0).to(device)
    _, _, h, w = tensor.shape
    long_side = max(h, w)
    scale = min(1.0, 896.0 / max(long_side, 1))
    if scale < 1:
        tensor = torch_f.interpolate(tensor, scale_factor=scale, mode="bilinear", align_corners=False)
    mean = torch.tensor([.485, .456, .406], device=device).view(1, 3, 1, 1)
    std = torch.tensor([.229, .224, .225], device=device).view(1, 3, 1, 1)
    tensor = (tensor - mean) / std
    with torch.inference_mode():
        logits = model(tensor)["out"]
        probs = torch.softmax(logits, dim=1)[:, 15:16]
        probs = torch_f.interpolate(probs, size=(h, w), mode="bilinear", align_corners=False)
    mask = (probs[0, 0].detach().cpu().numpy() >= threshold).astype(np.uint8) * 255
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    return cv2.GaussianBlur(mask, (0, 0), sigmaX=1.2)


def semantic_rotoscope(source: Path, output: Path, options: dict[str, Any]) -> dict[str, Any]:
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise RuntimeError("video_decode_failed")
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 24.0)
    size = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    writer = _video_writer(output, fps, size)
    threshold = float(options.get("threshold") or .45)
    max_seconds = float(options.get("max_seconds") or 90.0)
    max_frames = max(1, int(fps * max_seconds))
    frames = 0
    while frames < max_frames:
        ok, frame = cap.read()
        if not ok:
            break
        mask = person_mask(frame, threshold)
        writer.write(cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR))
        frames += 1
    cap.release()
    writer.release()
    return {
        "profile": "semantic-rotoscope",
        "subject": "person",
        "backend": "torchvision-deeplabv3-resnet50",
        "device": get_segmenter()._jc_device,
        "frames": frames,
    }


def _mask_reader(mask_path: Path | None):
    if not mask_path:
        return None, None
    image = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
    if image is not None:
        return "image", image
    cap = cv2.VideoCapture(str(mask_path))
    if cap.isOpened():
        return "video", cap
    return None, None


def object_aware_inpaint(source: Path, mask_path: Path | None, output: Path, options: dict[str, Any]) -> dict[str, Any]:
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise RuntimeError("video_decode_failed")
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 24.0)
    size = (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
    temp = EDITOR_OUTPUT_DIR / f"{output.stem}-inpaint-temp.mp4"
    writer = _video_writer(temp, fps, size)
    mask_kind, mask_reader = _mask_reader(mask_path)
    radius = max(1, min(15, int(options.get("radius") or 5)))
    dilate = max(0, min(31, int(options.get("dilate") or 7)))
    semantic_mode = str(options.get("mask_mode") or ("external" if mask_kind else "person"))
    max_seconds = float(options.get("max_seconds") or 60.0)
    max_frames = max(1, int(fps * max_seconds))
    frames = 0
    while frames < max_frames:
        ok, frame = cap.read()
        if not ok:
            break
        if mask_kind == "image":
            mask = mask_reader
        elif mask_kind == "video":
            m_ok, m_frame = mask_reader.read()
            mask = cv2.cvtColor(m_frame, cv2.COLOR_BGR2GRAY) if m_ok else np.zeros(size[::-1], np.uint8)
        elif semantic_mode == "person":
            mask = person_mask(frame, float(options.get("threshold") or .45))
        else:
            raise RuntimeError("mask_required")
        if mask.shape[:2] != frame.shape[:2]:
            mask = cv2.resize(mask, (frame.shape[1], frame.shape[0]), interpolation=cv2.INTER_NEAREST)
        mask = (mask > 24).astype(np.uint8) * 255
        if dilate:
            k = np.ones((dilate, dilate), np.uint8)
            mask = cv2.dilate(mask, k, iterations=1)
        cleaned = cv2.inpaint(frame, mask, radius, cv2.INPAINT_TELEA)
        writer.write(cleaned)
        frames += 1
    cap.release()
    if mask_kind == "video":
        mask_reader.release()
    writer.release()
    _mux_audio(temp, source, output)
    temp.unlink(missing_ok=True)
    return {
        "profile": "object-aware-inpaint",
        "maskMode": semantic_mode,
        "maskBackend": "semantic-person" if semantic_mode == "person" and not mask_path else "external-mask",
        "fillBackend": "opencv-telea",
        "frames": frames,
    }


def run_editor_job(job_id: str, operation: str, source: Path, mask_path: Path | None, options: dict[str, Any]) -> None:
    try:
        update_editor_job(job_id, status="processing", progress=.05)
        result: dict[str, Any] = {}
        result_path: Path | None = None
        with editor_lock:
            if operation == "probe":
                result = ffprobe(source)
            elif operation == "proxy":
                result_path = EDITOR_OUTPUT_DIR / f"{job_id}-proxy.mp4"
                result = transcode_proxy(source, result_path, options)
            elif operation == "render":
                codec = str(options.get("codec") or "h264")
                ext = ".mov" if codec in {"prores_422_hq", "dnxhr_hq"} else ".mp4"
                result_path = EDITOR_OUTPUT_DIR / f"{job_id}-master{ext}"
                result = render_master(source, result_path, options)
            elif operation == "optical_flow":
                result_path = EDITOR_OUTPUT_DIR / f"{job_id}-flow.mp4"
                result = dense_optical_flow(source, result_path, options)
            elif operation == "rotoscope":
                result_path = EDITOR_OUTPUT_DIR / f"{job_id}-mask.mp4"
                result = semantic_rotoscope(source, result_path, options)
            elif operation == "inpaint":
                result_path = EDITOR_OUTPUT_DIR / f"{job_id}-clean.mp4"
                result = object_aware_inpaint(source, mask_path, result_path, options)
            else:
                raise RuntimeError("unsupported_editor_operation")
        if result_path and not result_path.exists():
            raise RuntimeError("editor_output_missing")
        update_editor_job(
            job_id,
            status="completed",
            progress=1.0,
            result_url=f"{PUBLIC_BASE_URL}/v1/editor/jobs/{job_id}/result" if result_path else None,
            result=result,
            error=None,
            _output_path=str(result_path) if result_path else None,
        )
    except Exception as error:
        update_editor_job(job_id, status="failed", progress=1.0, error=str(error)[-4000:])
    finally:
        source.unlink(missing_ok=True)
        if mask_path:
            mask_path.unlink(missing_ok=True)


async def save_upload(upload: UploadFile, destination: Path) -> int:
    total = 0
    with destination.open("wb") as handle:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_EDITOR_UPLOAD_BYTES:
                handle.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="editor_upload_too_large")
            handle.write(chunk)
    if total < 128:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="editor_upload_too_small")
    return total


def safe_suffix(filename: str | None, fallback: str = ".bin") -> str:
    suffix = Path(filename or "").suffix.lower()
    return suffix if suffix and len(suffix) <= 8 and suffix.replace(".", "").isalnum() else fallback


@app.get("/health")
def health(_: dict = Depends(authorize_server)):
    generation_ready = WAN_ROOT.joinpath("generate.py").exists() and MODEL_DIR.exists() and bool(PUBLIC_BASE_URL)
    editor_ready = bool(PUBLIC_BASE_URL)
    return {
        "ready": generation_ready,
        "editorReady": editor_ready,
        "worker": "jc-film-studio-gpu-worker",
        "version": "2.1.0",
        "model_loaded": MODEL_DIR.exists(),
        "cuda": bool(torch.cuda.is_available()),
        "capabilities": {
            "generation": ["wan2.2-ti2v-5b"],
            "editor": ["probe", "proxy", "render", "optical_flow", "rotoscope", "inpaint"],
            "renderCodecs": ["h264", "h265", "prores_422_hq", "dnxhr_hq"],
        },
    }


@app.post("/v1/generations", status_code=202)
def create_generation(request: GenerationRequest, background: BackgroundTasks, _: dict = Depends(authorize_server)):
    if request.model != "Wan-AI/Wan2.2-TI2V-5B":
        raise HTTPException(status_code=400, detail="unsupported_model")
    if not MODEL_DIR.exists():
        raise HTTPException(status_code=503, detail="wan_model_not_downloaded")
    job_id = uuid.uuid4().hex
    with jobs_lock:
        jobs[job_id] = {"job_id": job_id, "status": "queued", "result_url": None, "error": None}
    background.add_task(run_generation, job_id, request)
    return {"job_id": job_id, "status": "queued", "estimated_gpu_minutes": 9}


@app.get("/v1/generations/{job_id}")
def generation_status(job_id: str, _: dict = Depends(authorize_server)):
    with jobs_lock:
        job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job_not_found")
    return job


@app.post("/v1/editor/jobs", status_code=202)
async def create_editor_job(
    background: BackgroundTasks,
    operation: str = Form(...),
    options: str = Form("{}"),
    media: UploadFile = File(...),
    mask: UploadFile | None = File(default=None),
    auth: dict = Depends(authorize_editor),
):
    operation = operation.strip().lower()
    if operation not in {"probe", "proxy", "render", "optical_flow", "rotoscope", "inpaint"}:
        raise HTTPException(status_code=400, detail="unsupported_editor_operation")
    require_op(auth, operation)
    try:
        parsed_options = json.loads(options or "{}")
        if not isinstance(parsed_options, dict):
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid_editor_options")
    job_id = uuid.uuid4().hex
    source = INPUT_DIR / f"editor-{job_id}{safe_suffix(media.filename)}"
    mask_path = INPUT_DIR / f"editor-{job_id}-mask{safe_suffix(mask.filename)}" if mask else None
    source_bytes = await save_upload(media, source)
    if mask and mask_path:
        await save_upload(mask, mask_path)
    with jobs_lock:
        editor_jobs[job_id] = {
            "job_id": job_id,
            "operation": operation,
            "status": "queued",
            "progress": 0.0,
            "result_url": None,
            "result": None,
            "error": None,
            "source_bytes": source_bytes,
            "cap_nonce": auth.get("nonce", "server"),
            "created_at": int(time.time()),
        }
    background.add_task(run_editor_job, job_id, operation, source, mask_path, parsed_options)
    now = int(time.time())
    job_capability = sign_editor_payload({
        "v": 1,
        "iat": now,
        "exp": now + 6 * 60 * 60,
        "ops": [operation],
        "nonce": auth.get("nonce", "server"),
        "job": job_id,
    })
    return {
        "job_id": job_id,
        "operation": operation,
        "status": "queued",
        "source_bytes": source_bytes,
        "job_capability": job_capability,
    }


def authorized_editor_job(job_id: str, auth: dict) -> dict[str, Any]:
    with jobs_lock:
        job = editor_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job_not_found")
    if auth.get("kind") != "server" and job.get("cap_nonce") != auth.get("nonce"):
        raise HTTPException(status_code=403, detail="job_capability_mismatch")
    if auth.get("job") and auth.get("job") != job_id:
        raise HTTPException(status_code=403, detail="job_capability_scope_mismatch")
    require_op(auth, job.get("operation", ""))
    return job


@app.get("/v1/editor/jobs/{job_id}")
def editor_job_status(job_id: str, auth: dict = Depends(authorize_editor)):
    job = authorized_editor_job(job_id, auth)
    return {k: v for k, v in job.items() if not k.startswith("_")}


@app.get("/v1/editor/jobs/{job_id}/result")
def editor_job_result(job_id: str, auth: dict = Depends(authorize_editor)):
    job = authorized_editor_job(job_id, auth)
    if job.get("status") != "completed":
        raise HTTPException(status_code=409, detail="job_not_complete")
    value = job.get("_output_path")
    if not value:
        raise HTTPException(status_code=404, detail="job_has_no_result_file")
    path = Path(value).resolve()
    root = EDITOR_OUTPUT_DIR.resolve()
    if root not in path.parents or not path.exists():
        raise HTTPException(status_code=404, detail="result_file_missing")
    suffix = path.suffix.lower()
    media_type = "video/quicktime" if suffix == ".mov" else "video/mp4"
    return FileResponse(path, media_type=media_type, filename=path.name, headers={"cache-control": "private, no-store"})
