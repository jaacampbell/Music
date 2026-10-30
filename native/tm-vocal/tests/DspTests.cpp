#include "VocalDsp.h"
#include <cstdlib>
#include <iostream>
#include <new>
#include <atomic>
static std::atomic<int> allocations{0};
void* operator new(std::size_t n) { allocations.fetch_add(1);if(auto* p=std::malloc(n))return p;throw std::bad_alloc(); }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p,std::size_t) noexcept { std::free(p); }
static void check(bool ok,const char* message) { if(!ok) {std::cerr<<message<<'\n';std::exit(1);} }
static tmv::Settings dry() { tmv::Settings s;s.eq=s.comp=s.ess=s.sat=s.space=s.echo=false;return s; }
int main() {
    for(double sr:{44100.0,48000.0,96000.0}) for(int channels:{1,2}) {
        tmv::VocalDsp dsp;dsp.prepare(sr);
        std::array<float,1024> left{},right{};float* ptr[]{left.data(),right.data()};
        auto signal=[&]{for(size_t i=0;i<left.size();++i)left[i]=right[i]=0.6f*std::sin(2*tmv::pi*200*static_cast<float>(i)/static_cast<float>(sr));};
        signal();const auto original=left;auto s=dry();s.bypass=true;
        dsp.process(ptr,channels,1024,s);check(left==original,"Bypass must be sample exact");
        dsp.reset();signal();s=dry();s.mix=0;s.output=0;
        dsp.process(ptr,channels,1024,s);check(left==original,"Zero mix must preserve dry signal");
        dsp.reset();signal();s=dry();s.output=-6;
        dsp.process(ptr,channels,1024,s);
        check(std::abs(left[125]-original[125]*tmv::gain(-6))<1.0e-6f,"Output gain is incorrect");
        dsp.reset();s=dry();s.comp=true;s.threshold=-30;s.ratio=8;
        for(int block=0;block<10;++block){signal();dsp.process(ptr,channels,1024,s);}
        check(dsp.reduction>15,"Compressor did not reduce loud input");
        dsp.reset();s={};s.drive=100;s.delay=100;s.reverb=100;s.time=1500;
        const auto before=allocations.load();
        for(int block=0;block<200;++block) {
            signal();if(block==30)s.time=30;if(block==80)s.tracking=true;
            if(block==100)s.bypass=true;if(block==120)s.bypass=false;
            dsp.process(ptr,channels,1024,s);
            for(int ch=0;ch<channels;++ch)for(int i=0;i<1024;++i)
                check(std::isfinite(ptr[ch][i])&&std::abs(ptr[ch][i])<10,"Full chain unstable");
        }
        check(allocations.load()==before,"Audio thread allocated memory");
        dsp.reset();left.fill(0);right.fill(0);dsp.process(ptr,channels,1024,s);
        for(float sample:left)check(sample==0,"Reset must clear tails");
    }
    // Reverb/delay must produce tails, while tracking suppresses both sends.
    for(bool tracking:{false,true}) {
        tmv::VocalDsp dsp;dsp.prepare(48000);auto s=dry();s.space=s.echo=true;s.reverb=s.delay=100;s.time=30;s.tracking=tracking;
        std::array<float,8192> audio{};audio[0]=1;float* ptr[]{audio.data()};dsp.process(ptr,1,8192,s);
        float energy=0;for(size_t i=1;i<audio.size();++i)energy+=audio[i]*audio[i];
        check(tracking?energy==0:energy>0.01f,"Space/Tracking behavior incorrect");
    }
    std::cout<<"PASS: mono/stereo, 44.1/48/96 kHz, bypass, wet/dry, gain, compression, tails, tracking, automation stability, reset, zero playback allocations\n";
}
