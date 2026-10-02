#pragma once
#include <juce_audio_utils/juce_audio_utils.h>
#include "VocalDsp.h"

class TMVocalProcessor final : public juce::AudioProcessor {
public:
    TMVocalProcessor();
    void prepareToPlay(double,int) override;
    void releaseResources() override {}
    void reset() override { engine.reset(); }
    void processBlock(juce::AudioBuffer<float>&,juce::MidiBuffer&) override;
    bool isBusesLayoutSupported(const BusesLayout&) const override;
    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }
    const juce::String getName() const override { return "TM Vocal"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    double getTailLengthSeconds() const override { return 3; }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int,const juce::String&) override {}
    void getStateInformation(juce::MemoryBlock&) override;
    void setStateInformation(const void*,int) override;
    void applyPreset(int);
    void savePreset(const juce::File&);
    bool loadPreset(const juce::File&);
    juce::AudioProcessorValueTreeState state;
    std::atomic<float> inputMeter{0},outputMeter{0},gainReduction{0};
private:
    static juce::AudioProcessorValueTreeState::ParameterLayout layout();
    void restore(const juce::ValueTree&);
    tmv::VocalDsp engine;
    std::array<std::atomic<float>*,22> values{};
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(TMVocalProcessor)
};
