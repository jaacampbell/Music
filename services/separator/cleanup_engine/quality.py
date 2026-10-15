"""Signal-integrity quality gates, not a perceptual audio quality certificate."""
from dataclasses import dataclass, asdict
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

@dataclass(frozen=True)
class QualityLimits:
    max_true_peak_dbfs: float = -0.3
    max_level_drop_db: float = 12.0
    max_level_rise_db: float = 12.0
    max_channel_imbalance_shift_db: float = 6.0

def _db(v):
    return float(20*np.log10(max(float(v),1e-12)))

def _rms(v):
    return float(np.sqrt(np.mean(np.square(v,dtype=np.float64))))

def inspect_pair(source, rendered, limits=QualityLimits()):
    a, sr = sf.read(str(source),always_2d=True,dtype="float64")
    b, br = sf.read(str(rendered),always_2d=True,dtype="float64")
    errors=[]
    if sr != br: errors.append("sample_rate_changed")
    if a.shape != b.shape: errors.append("sample_count_or_channels_changed")
    if not np.isfinite(b).all(): errors.append("nonfinite_samples")
    if not b.size: errors.append("empty_output")
    if errors: return {"passed":False,"errors":errors,"metrics":{}}
    peak=_db(np.max(np.abs(resample_poly(b,4,1,axis=0))))
    if peak > limits.max_true_peak_dbfs+0.05: errors.append("true_peak_exceeds_ceiling")
    src, dst = _rms(a), _rms(b)
    delta=_db(dst)-_db(src)
    if src>1e-7 and delta < -limits.max_level_drop_db: errors.append("excessive_level_drop")
    if src>1e-7 and delta > limits.max_level_rise_db: errors.append("excessive_level_rise")
    if src>1e-5 and _db(dst)<-55: errors.append("unexpected_silence")
    shift=0.0
    if b.shape[1]==2 and min(_rms(a[:,0]),_rms(a[:,1]))>1e-7:
        shift=(_db(_rms(b[:,0]))-_db(_rms(b[:,1])))-(_db(_rms(a[:,0]))-_db(_rms(a[:,1])))
        if abs(shift)>limits.max_channel_imbalance_shift_db: errors.append("stereo_balance_shift")
    return {"passed":not errors,"errors":errors,"metrics":{"sample_rate":sr,"samples":len(b),"channels":b.shape[1],"true_peak_dbfs_approx":round(peak,3),"rms_delta_db":round(delta,3),"stereo_balance_shift_db":round(shift,3)},"limits":asdict(limits)}
