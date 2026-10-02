#!/usr/bin/env python3
"""Build, test, package, install and validate TM Vocal without cloud credentials."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "native/tm-vocal"


class Workflow:
    def __init__(self, args):
        self.args = args
        self.build_dir = Path(args.build_dir).resolve()
        self.out = ROOT / "native/dist"
        self.system = platform.system()
        self.results = []

    def run(self, command):
        print("+", " ".join(str(s) for s in command), flush=True)
        self.build_dir.mkdir(parents=True, exist_ok=True)
        with (self.build_dir / "workflow.log").open("a", encoding="utf-8") as log:
            log.write("\n+ " + " ".join(str(s) for s in command) + "\n")
            with subprocess.Popen([str(s) for s in command], cwd=ROOT,
                                  stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                  text=True, encoding="utf-8", errors="replace") as process:
                for line in process.stdout:
                    print(line, end="", flush=True)
                    log.write(line)
                code = process.wait()
        self.results.append({"command": [str(s) for s in command], "exit_code": code})
        if code:
            raise RuntimeError(f"Command failed ({code}); see {self.build_dir / 'workflow.log'}")

    def tool(self, name):
        found = shutil.which(name)
        if not found:
            raise RuntimeError(f"Missing {name}. Install the build prerequisites in docs/cursor-native-workflow.md.")
        return found

    def doctor(self):
        for name in ("cmake", "ctest"):
            self.run([self.tool(name), "--version"])
        if self.system == "Darwin":
            self.run([self.tool("xcode-select"), "-p"])
        elif self.system == "Windows":
            if not shutil.which("cl"):
                raise RuntimeError("Run from the Visual Studio x64 Native Tools terminal (Desktop development with C++).")
        else:
            self.tool("c++")
            if not self.args.dsp_only:
                self.run([self.tool("pkg-config"), "--exists", "alsa", "freetype2", "fontconfig"])
        print("Prerequisite checks passed; the compiler will verify SDK availability.")

    def build(self):
        command = [self.tool("cmake"), "-S", SOURCE, "-B", self.build_dir,
                   "-DCMAKE_BUILD_TYPE=Release",
                   "-DTM_BUILD_PLUGIN=" + ("OFF" if self.args.dsp_only else "ON")]
        if self.args.juce_source:
            command.append("-DTM_JUCE_SOURCE=" + str(Path(self.args.juce_source).resolve()))
        if self.system == "Darwin":
            command += ["-DCMAKE_OSX_ARCHITECTURES=arm64;x86_64", "-DCMAKE_OSX_DEPLOYMENT_TARGET=11.0"]
        self.run(command)
        self.run([self.tool("cmake"), "--build", self.build_dir, "--config", "Release",
                  "--parallel", str(self.args.jobs)])

    def test(self):
        self.run([self.tool("ctest"), "--test-dir", self.build_dir, "-C", "Release", "--output-on-failure", "--no-tests=error"])

    @property
    def artefacts(self):
        return self.build_dir / "TMVocal_artefacts/Release"

    def bundles(self):
        binary = {"Darwin": "Contents/MacOS/TM Vocal", "Windows": "Contents/x86_64-win/TM Vocal.vst3",
                  "Linux": "Contents/x86_64-linux/TM Vocal.so"}[self.system]
        result = [("VST3", self.artefacts / "VST3/TM Vocal.vst3", binary)]
        if self.system == "Darwin":
            result += [("AU", self.artefacts / "AU/TM Vocal.component", "Contents/MacOS/TM Vocal"),
                       ("Standalone", self.artefacts / "Standalone/TM Vocal.app", "Contents/MacOS/TM Vocal")]
        else:
            result.append(("Standalone", self.artefacts / ("Standalone/TM Vocal.exe" if self.system == "Windows" else "Standalone/TM Vocal"), None))
        for _, bundle, relative in result:
            actual = bundle / relative if relative else bundle
            if not actual.is_file():
                raise RuntimeError(f"Missing native binary: {actual}; build first.")
        return result

    def package(self):
        if self.args.dsp_only:
            print("DSP-only run: packaging skipped.")
            return
        self.out.mkdir(parents=True, exist_ok=True)
        label = "macOS" if self.system == "Darwin" else self.system
        version = "0.1.0"
        archive = self.out / f"TM-Vocal-{label}-{version}.zip"
        manifest = {"product": "TM Vocal", "version": version, "platform": label,
                    "built_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
                    "release_status": "unsigned alpha; DAW acceptance pending", "files": []}
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
            for _, bundle, _ in self.bundles():
                paths = bundle.rglob("*") if bundle.is_dir() else [bundle]
                for path in paths:
                    if path.is_file():
                        relative = str(path.relative_to(self.artefacts))
                        z.write(path, relative)
                        manifest["files"].append({"path": relative, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
            z.write(SOURCE / "README.md", "README.md")
            z.writestr("build-manifest.json", json.dumps(manifest, indent=2))
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        archive.with_suffix(".zip.sha256").write_text(f"{digest}  {archive.name}\n", encoding="utf-8")
        print(f"Package: {archive}")

    def install(self):
        if self.args.dsp_only:
            raise RuntimeError("DSP-only builds cannot be installed.")
        if self.system == "Windows":
            raise RuntimeError("Windows: copy the packaged .vst3 bundle to C:\\Program Files\\Common Files\\VST3 using your normal installer privileges.")
        base = Path.home() / ("Library/Audio/Plug-Ins" if self.system == "Darwin" else ".vst3")
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
        backup = Path.home() / "TM-Music-Studio/plugin-backups" / stamp
        for kind, source, _ in self.bundles():
            if kind == "Standalone":
                continue
            directory = base / ("VST3" if kind == "VST3" else "Components") if self.system == "Darwin" else base
            directory.mkdir(parents=True, exist_ok=True)
            dest = directory / source.name
            if dest.exists():
                backup.mkdir(parents=True, exist_ok=True)
                shutil.move(str(dest), str(backup / dest.name))
            try:
                shutil.copytree(source, dest, symlinks=True)
            except Exception:
                if dest.exists(): shutil.rmtree(dest)
                previous = backup / dest.name
                if previous.exists(): shutil.move(str(previous), str(dest))
                raise
            print(f"Installed: {dest}")
        print(f"Previous bundles, when present: {backup}")

    def validate(self):
        if self.args.dsp_only:
            raise RuntimeError("DSP-only builds have no plugin wrapper to validate.")
        if self.system == "Darwin":
            for _, bundle, binary in self.bundles():
                self.run([self.tool("lipo"), "-verify_arch", "arm64", "x86_64", bundle / binary])
            installed = Path.home() / "Library/Audio/Plug-Ins/Components/TM Vocal.component"
            if not installed.exists():
                raise RuntimeError("Install the Mac AU before auval: use all --install --validate.")
            actual = installed / "Contents/MacOS/TM Vocal"
            built = self.artefacts / "AU/TM Vocal.component/Contents/MacOS/TM Vocal"
            if not actual.is_file() or hashlib.sha256(actual.read_bytes()).digest() != hashlib.sha256(built.read_bytes()).digest():
                raise RuntimeError("Installed AU differs from this build. Run install before validation.")
            self.run([self.tool("auval"), "-v", "aufx", "TmVo", "TmMs"])
        else:
            print("AU validation applies only to macOS.")
        if self.args.pluginval:
            vst = self.artefacts / "VST3/TM Vocal.vst3"
            self.run([str(Path(self.args.pluginval).resolve()), "--strictness-level", "5", "--validate", vst])
        else:
            print("VST3 host validation not run: optional --pluginval /path/to/pluginval. Ableton scan/listening remains a manual acceptance step.")

    def execute(self):
        try:
            if self.args.command == "all":
                self.doctor(); self.build(); self.test(); self.package()
                if self.args.install: self.install()
                if self.args.validate: self.validate()
            else:
                getattr(self, self.args.command)()
            status = "passed"
        except Exception as exc:
            status = "failed"
            self.error = str(exc)
            raise
        finally:
            self.build_dir.mkdir(parents=True, exist_ok=True)
            (self.build_dir / "workflow-result.json").write_text(json.dumps({
                "status": locals().get("status", "failed"), "command": self.args.command,
                "platform": self.system, "error": getattr(self, "error", None),
                "commands": self.results, "daw_acceptance": "not measured; requires Ableton scan and listening"
            }, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["doctor", "build", "test", "package", "install", "validate", "all"])
    parser.add_argument("--build-dir", default=str(ROOT / "native/build-cli"))
    parser.add_argument("--jobs", type=int, default=2)
    parser.add_argument("--juce-source")
    parser.add_argument("--pluginval")
    parser.add_argument("--dsp-only", action="store_true")
    parser.add_argument("--install", action="store_true", help="Install bundles after the all command")
    parser.add_argument("--validate", action="store_true", help="Validate wrappers after the all command")
    args = parser.parse_args()
    if args.jobs < 1: parser.error("--jobs must be positive")
    if args.command != "all" and (args.install or args.validate):
        parser.error("--install/--validate flags require all; otherwise use the install/validate subcommand")
    try:
        Workflow(args).execute()
    except (RuntimeError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
