#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>

namespace tmv {
constexpr float pi = 3.14159265358979323846f;
inline float gain(float db) { return std::pow(10.0f, db / 20.0f); }
struct Settings {
    float input = 0, body = 0, presence = 1.5f, threshold = -18, ratio = 3;
    float deess = 35, drive = 10, reverb = 8, delay = 5, time = 250;
    float mix = 100, output = 0;
    bool eq = true, comp = true, ess = true, sat = true, space = true, echo = true;
    bool bypass = false, tracking = false;
};
struct Biquad {
    float b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, z1 = 0, z2 = 0;
    float tick(float x) noexcept {
        const float y = b0*x + z1;
        z1 = b1*x - a1*y + z2; z2 = b2*x - a2*y; return y;
    }
    void reset() noexcept { z1 = z2 = 0; }
    void configure(double sr, float hz, float q, float db, int type) noexcept {
        const float w = 2*pi*std::min(hz, static_cast<float>(sr)*0.45f)/static_cast<float>(sr);
        const float c = std::cos(w), s = std::sin(w), alpha = s/(2*q), A = gain(db*0.5f);
        float norm;
        if(type == 0) { // high-pass
            norm = 1+alpha; b0=(1+c)*0.5f/norm; b1=-(1+c)/norm; b2=b0;
            a1=-2*c/norm; a2=(1-alpha)/norm;
        } else if(type == 1) { // peaking EQ
            norm=1+alpha/A; b0=(1+alpha*A)/norm; b1=-2*c/norm;
            b2=(1-alpha*A)/norm; a1=b1; a2=(1-alpha/A)/norm;
        } else { // band-pass sibilance detector
            norm=1+alpha; b0=alpha/norm; b1=0; b2=-b0;
            a1=-2*c/norm; a2=(1-alpha)/norm;
        }
    }
};
struct Comb {
    std::vector<float> data; size_t pos = 0; float damp = 0;
    void prepare(size_t n) { data.assign(n, 0); pos=0; damp=0; }
    float tick(float x) noexcept {
        const float out=data[pos]; damp=out*0.65f+damp*0.35f;
        data[pos]=x+damp*0.72f; if(++pos==data.size()) pos=0; return out;
    }
    void reset() { std::fill(data.begin(),data.end(),0); pos=0; damp=0; }
};
class VocalDsp {
public:
    void prepare(double sampleRate) {
        sr=std::max(8000.0,sampleRate); smoothing=1-std::exp(-1.0f/static_cast<float>(sr*0.02));
        attack=std::exp(-1.0f/static_cast<float>(sr*0.005)); release=std::exp(-1.0f/static_cast<float>(sr*0.08));
        essAttack=std::exp(-1.0f/static_cast<float>(sr*0.001));
        for(size_t ch=0;ch<2;++ch) {
            delays[ch].assign(static_cast<size_t>(sr*2)+2,0);
            for(size_t k=0;k<4;++k) combs[ch][k].prepare(static_cast<size_t>(sr*(0.0297+0.0061*static_cast<double>(k)+0.0007*static_cast<double>(ch))));
            high[ch].configure(sr,65,0.707f,0,0); detector[ch].configure(sr,6500,1.3f,0,2);
        }
        reset();
    }
    void reset() {
        envelope=essEnvelope=0; writePos=0; primed=false;
        for(size_t ch=0;ch<2;++ch) {
            high[ch].reset(); body[ch].reset(); presence[ch].reset(); detector[ch].reset();
            std::fill(delays[ch].begin(),delays[ch].end(),0);
            for(auto& c:combs[ch]) c.reset();
        }
    }
    void process(float* const* channels, int count, int samples, Settings s) noexcept {
        count=std::clamp(count,1,2);
        // Coefficients use fixed storage; no allocation or locks in playback.
        std::array<float,20> target { gain(s.input),s.threshold,std::clamp(s.ratio,1.0f,12.0f),s.deess/100,
            s.drive/100,s.reverb/100,s.delay/100,std::clamp(s.time,30.0f,1500.0f)*static_cast<float>(sr)/1000,
            s.mix/100,gain(s.output),float(s.eq),float(s.comp),float(s.ess),float(s.sat),
            float(s.space&&!s.tracking),float(s.echo&&!s.tracking),float(!s.bypass),s.body,s.presence,0 };
        if(!primed) { current=target; primed=true; }
        inputPeak=outputPeak=0; reduction=0;
        for(int i=0;i<samples;++i) {
            for(size_t p=0;p<current.size();++p) current[p]+=(target[p]-current[p])*smoothing;
            if(i%32==0) for(int ch=0;ch<count;++ch) {
                body[static_cast<size_t>(ch)].configure(sr,180,0.8f,current[17],1);
                presence[static_cast<size_t>(ch)].configure(sr,3200,0.8f,current[18],1);
            }
            std::array<float,2> dry{}, wet{}; float peak=0, essPeak=0;
            for(int ch=0;ch<count;++ch) {
                const auto c=static_cast<size_t>(ch); dry[c]=channels[ch][i];
                inputPeak=std::max(inputPeak,std::abs(dry[c]));
                float x=dry[c]*current[0];
                const float shaped=presence[c].tick(body[c].tick(high[c].tick(x)));
                x+=(shaped-x)*current[10]; wet[c]=x;
                peak=std::max(peak,std::abs(x)); essPeak=std::max(essPeak,std::abs(detector[c].tick(x)));
            }
            envelope=peak+(envelope-peak)*(peak>envelope?attack:release);
            essEnvelope=essPeak+(essEnvelope-essPeak)*(essPeak>essEnvelope?essAttack:release);
            const float db=20*std::log10(std::max(envelope,1.0e-9f));
            const float gr=std::max(0.0f,db-current[1])*(1-1/current[2])*current[11];
            reduction=std::max(reduction,gr);
            const float compression=gain(-gr);
            const float essGain=1/(1+std::max(0.0f,essEnvelope-0.025f)*current[3]*16*current[12]);
            for(int ch=0;ch<count;++ch) {
                const auto c=static_cast<size_t>(ch); float x=wet[c]*compression*essGain;
                const float driven=std::tanh(x*(1+current[4]*5))/(1+current[4]*2);
                x+=(driven-x)*current[13];
                // Fractional delay read avoids clicks when time/tempo changes.
                const auto size=delays[c].size();
                double read=static_cast<double>(writePos)-current[7];
                if(read<0) read+=static_cast<double>(size);
                const auto a=static_cast<size_t>(read)%size, b=(a+1)%size;
                const float f=static_cast<float>(read-std::floor(read));
                const float echo=delays[c][a]*(1-f)+delays[c][b]*f;
                delays[c][writePos]=x+echo*0.28f;
                float verb=0; for(auto& comb:combs[c]) verb+=comb.tick(x*0.2f);
                x+=echo*current[6]*current[15]+verb*current[5]*current[14]*0.5f;
                const float mixed=(dry[c]+(x-dry[c])*current[8])*current[9];
                channels[ch][i]=dry[c]+(mixed-dry[c])*current[16];
                outputPeak=std::max(outputPeak,std::abs(channels[ch][i]));
            }
            if(++writePos==delays[0].size()) writePos=0;
        }
    }
    float inputPeak=0,outputPeak=0,reduction=0;
private:
    double sr=48000; float smoothing=0,attack=0,release=0,essAttack=0,envelope=0,essEnvelope=0;
    size_t writePos=0; bool primed=false;
    std::array<float,20> current{};
    std::array<Biquad,2> high,body,presence,detector;
    std::array<std::vector<float>,2> delays;
    std::array<std::array<Comb,4>,2> combs;
};
} // namespace tmv
