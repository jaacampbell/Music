#include "PluginProcessor.h"
#include "PluginEditor.h"
namespace {
constexpr std::array<const char*,22> ids {"input","body","presence","threshold","ratio","deess","drive","reverb","delay","time","mix","output","eq","comp","ess","sat","space","echo","bypass","tracking","sync","division"};
}
juce::AudioProcessorValueTreeState::ParameterLayout TMVocalProcessor::layout() {
    juce::AudioProcessorValueTreeState::ParameterLayout p;
    auto add=[&](const char* id,const char* name,float lo,float hi,float def,const char* unit) {
        p.add(std::make_unique<juce::AudioParameterFloat>(juce::ParameterID{id,1},name,
            juce::NormalisableRange<float>(lo,hi,0.1f),def,
            juce::AudioParameterFloatAttributes().withLabel(unit)));
    };
    add("input","Input",-24,24,0,"dB"); add("body","Body",-9,9,0,"dB");
    add("presence","Presence",-9,9,1.5f,"dB"); add("threshold","Threshold",-48,0,-18,"dB");
    add("ratio","Ratio",1,12,3,":1"); add("deess","De-ess",0,100,35,"%");
    add("drive","Drive",0,100,10,"%"); add("reverb","Reverb",0,100,8,"%");
    add("delay","Delay",0,100,5,"%"); add("time","Delay time",30,1500,250,"ms");
    add("mix","Mix",0,100,100,"%"); add("output","Output",-24,12,0,"dB");
    for(auto id: {"eq","comp","ess","sat","space","echo"})
        p.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID{id,1},juce::String(id).toUpperCase(),true));
    for(auto id: {"bypass","tracking","sync"})
        p.add(std::make_unique<juce::AudioParameterBool>(juce::ParameterID{id,1},id,false));
    p.add(std::make_unique<juce::AudioParameterChoice>(juce::ParameterID{"division",1},"Delay division",juce::StringArray{"1/4","1/8","1/8 dotted","1/16"},1));
    return p;
}
TMVocalProcessor::TMVocalProcessor():AudioProcessor(BusesProperties()
    .withInput("Vocal",juce::AudioChannelSet::stereo(),true)
    .withOutput("Output",juce::AudioChannelSet::stereo(),true)),state(*this,nullptr,"TM_VOCAL",layout()) {
    for(size_t i=0;i<ids.size();++i) values[i]=state.getRawParameterValue(ids[i]);
}
void TMVocalProcessor::prepareToPlay(double sr,int) { engine.prepare(sr); setLatencySamples(0); }
bool TMVocalProcessor::isBusesLayoutSupported(const BusesLayout& b) const {
    const auto out=b.getMainOutputChannelSet();
    return (out==juce::AudioChannelSet::mono()||out==juce::AudioChannelSet::stereo())&&out==b.getMainInputChannelSet();
}
void TMVocalProcessor::processBlock(juce::AudioBuffer<float>& buffer,juce::MidiBuffer&) {
    juce::ScopedNoDenormals noDenormals;
    tmv::Settings s;
    auto v=[&](size_t i){return values[i]->load(std::memory_order_relaxed);};
    s.input=v(0);s.body=v(1);s.presence=v(2);s.threshold=v(3);s.ratio=v(4);s.deess=v(5);
    s.drive=v(6);s.reverb=v(7);s.delay=v(8);s.time=v(9);s.mix=v(10);s.output=v(11);
    s.eq=v(12)>0.5f;s.comp=v(13)>0.5f;s.ess=v(14)>0.5f;s.sat=v(15)>0.5f;
    s.space=v(16)>0.5f;s.echo=v(17)>0.5f;s.bypass=v(18)>0.5f;s.tracking=v(19)>0.5f;
    if(v(20)>0.5f) if(auto* host=getPlayHead()) if(auto pos=host->getPosition()) if(auto bpm=pos->getBpm()) {
        constexpr std::array<float,4> beats{1,0.5f,0.75f,0.25f};
        if(std::isfinite(*bpm)&&*bpm>0) s.time=static_cast<float>(60000.0/ *bpm)*beats[static_cast<size_t>(juce::jlimit(0,3,static_cast<int>(v(21))))];
    }
    for(int ch=getTotalNumInputChannels();ch<buffer.getNumChannels();++ch) buffer.clear(ch,0,buffer.getNumSamples());
    if(buffer.getNumChannels()<1) return;
    engine.process(buffer.getArrayOfWritePointers(),buffer.getNumChannels(),buffer.getNumSamples(),s);
    inputMeter.store(engine.inputPeak,std::memory_order_relaxed);
    outputMeter.store(engine.outputPeak,std::memory_order_relaxed);
    gainReduction.store(engine.reduction,std::memory_order_relaxed);
}
void TMVocalProcessor::getStateInformation(juce::MemoryBlock& dest) {
    auto xml=state.copyState().createXml(); copyXmlToBinary(*xml,dest);
}
void TMVocalProcessor::restore(const juce::ValueTree& tree) {
    if(!tree.isValid()||tree.getType()!=state.state.getType()) return;
    // Keep the fixed parameter schema; reject unknown/nonfinite preset values.
    for(auto child:tree) {
        auto* parameter=state.getParameter(child["id"].toString()); if(parameter==nullptr) continue;
        const auto raw=child["value"]; float value=0;
        if(raw.isString()) {
            const auto text=raw.toString().trim(); const char* start=text.toRawUTF8(); char* end=nullptr;
            value=std::strtof(start,&end);if(end==start||*end!='\0') continue;
        } else if(raw.isDouble()||raw.isInt()) value=static_cast<float>(raw);
        else continue;
        if(!std::isfinite(value)) continue;
        parameter->setValueNotifyingHost(juce::jlimit(0.0f,1.0f,parameter->convertTo0to1(value)));
    }
}
void TMVocalProcessor::setStateInformation(const void* data,int size) {
    if(auto xml=getXmlFromBinary(data,size)) restore(juce::ValueTree::fromXml(*xml));
}
void TMVocalProcessor::savePreset(const juce::File& file) { state.copyState().createXml()->writeTo(file); }
bool TMVocalProcessor::loadPreset(const juce::File& file) {
    if(file.getSize()>1024*1024) return false;
    if(auto xml=juce::XmlDocument::parse(file)) {
        const auto tree=juce::ValueTree::fromXml(*xml);
        if(tree.getType()==state.state.getType()) { restore(tree);return true; }
    }
    return false;
}
void TMVocalProcessor::applyPreset(int index) {
    constexpr float presets[4][12] = {
        {0,0,1.5f,-18,3,35,10,8,5,250,100,0},
        {0,1.5f,2,-20,3,45,15,4,3,190,100,2},
        {0,0,2.5f,-18,4,40,20,0,0,250,100,2},
        {0,-1,2,-22,3,45,12,28,20,375,100,2}
    };
    const auto selected=juce::jlimit(0,3,index);
    for(size_t i=0;i<12;++i) { auto* p=state.getParameter(ids[i]);p->beginChangeGesture();
        p->setValueNotifyingHost(p->convertTo0to1(presets[selected][i]));p->endChangeGesture(); }
    for(size_t i=12;i<18;++i) { auto* p=state.getParameter(ids[i]);p->setValueNotifyingHost(1); }
}
juce::AudioProcessorEditor* TMVocalProcessor::createEditor() { return new TMVocalEditor(*this); }
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new TMVocalProcessor(); }
