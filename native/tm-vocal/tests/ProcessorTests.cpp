#include "PluginProcessor.h"
#include <iostream>
#include <cstdlib>
static void check(bool ok,const char* why) { if(!ok){std::cerr<<why<<'\n';std::exit(1);} }
int main() {
    juce::ScopedJuceInitialiser_GUI init;
    TMVocalProcessor p;
    auto* input=p.state.getParameter("input");input->setValueNotifyingHost(input->convertTo0to1(7.5f));
    juce::MemoryBlock data;p.getStateInformation(data);
    TMVocalProcessor recalled;recalled.setStateInformation(data.getData(),static_cast<int>(data.getSize()));
    check(std::abs(recalled.state.getRawParameterValue("input")->load()-7.5f)<0.01f,"DAW state recall failed");
    auto file=juce::File::getSpecialLocation(juce::File::tempDirectory).getNonexistentChildFile("tm-vocal-test",".tmvocal");
    p.savePreset(file);check(recalled.loadPreset(file),"File preset failed to load");
    check(std::abs(recalled.state.getRawParameterValue("input")->load()-7.5f)<0.01f,"File preset value not restored");
    file.replaceWithText("<TM_VOCAL><PARAM id=\"input\" value=\"nan\"/></TM_VOCAL>");
    recalled.loadPreset(file);check(std::isfinite(recalled.state.getRawParameterValue("input")->load()),"NaN preset accepted");
    file.replaceWithText("<TM_VOCAL><PARAM id=\"input\" value=\"999\"/></TM_VOCAL>");recalled.loadPreset(file);
    check(recalled.state.getRawParameterValue("input")->load()<=24,"Preset bounds bypassed");file.deleteFile();
    recalled.applyPreset(1);recalled.prepareToPlay(48000,512);
    juce::AudioBuffer<float> audio(2,512);juce::MidiBuffer midi;
    for(int i=0;i<512;++i) audio.setSample(0,i,0.4f*std::sin(2*tmv::pi*220*static_cast<float>(i)/48000));
    audio.copyFrom(1,0,audio,0,0,512);recalled.processBlock(audio,midi);
    for(int c=0;c<2;++c)for(int i=0;i<512;++i)check(std::isfinite(audio.getSample(c,i)),"Processor output invalid");
    check(recalled.getLatencySamples()==0,"Unexpected added latency");
    std::cout<<"PASS: parameter state recall, file presets, nonfinite rejection, bounds, native processor render, latency\n";
}
