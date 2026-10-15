"""Music OS audio-restoration tools.

Keep package imports lightweight: Film Studio's independent safety tests do not
install the audio DSP stack. Lazy loading preserves the public API.
"""

__all__ = ["CleanupSettings", "process_stem"]


def __getattr__(name):
    if name in __all__:
        from .engine import CleanupSettings, process_stem
        return {"CleanupSettings": CleanupSettings, "process_stem": process_stem}[name]
    raise AttributeError(name)
