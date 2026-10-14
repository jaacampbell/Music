import numpy as np
import soundfile as sf
from .quality import inspect_pair

def tone(path,amp=.2,sr=44100,channels=2):
    t=np.arange(sr)/sr
    x=amp*np.sin(2*np.pi*440*t)
    sf.write(path,np.column_stack([x,x*.8]) if channels==2 else x,sr,subtype="PCM_24")

def test_identity(tmp_path):
    a=tmp_path/"a.wav";tone(a)
    assert inspect_pair(a,a)["passed"]

def test_sample_rate(tmp_path):
    a=tmp_path/"a.wav";b=tmp_path/"b.wav";tone(a);tone(b,sr=48000)
    assert "sample_rate_changed" in inspect_pair(a,b)["errors"]

def test_silence(tmp_path):
    a=tmp_path/"a.wav";b=tmp_path/"b.wav";tone(a);sf.write(b,np.zeros((44100,2)),44100)
    assert "unexpected_silence" in inspect_pair(a,b)["errors"]

def test_clipping(tmp_path):
    a=tmp_path/"a.wav";b=tmp_path/"b.wav";tone(a);tone(b,amp=.99)
    assert "true_peak_exceeds_ceiling" in inspect_pair(a,b)["errors"]

def test_stereo_balance(tmp_path):
    a=tmp_path/"a.wav";b=tmp_path/"b.wav";tone(a)
    t=np.arange(44100)/44100;x=.2*np.sin(2*np.pi*440*t)
    sf.write(b,np.column_stack([x,x*.02]),44100)
    assert "stereo_balance_shift" in inspect_pair(a,b)["errors"]

def test_mono(tmp_path):
    a=tmp_path/"a.wav";tone(a,channels=1)
    assert inspect_pair(a,a)["passed"]
