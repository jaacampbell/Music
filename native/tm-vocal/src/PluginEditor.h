#pragma once
#include "PluginProcessor.h"
class TMVocalEditor final : public juce::AudioProcessorEditor,private juce::Timer {
public:
    explicit TMVocalEditor(TMVocalProcessor&);
    ~TMVocalEditor() override;
    void paint(juce::Graphics&) override;
    void resized() override;
private:
    void timerCallback() override;
    void chooseFile(bool save);
    TMVocalProcessor& processor;
    juce::LookAndFeel_V4 skin;
    std::array<juce::Slider,12> knobs;
    std::array<juce::Label,12> labels;
    std::vector<std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment>> sliders;
    std::array<juce::ToggleButton,9> toggles;
    std::vector<std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment>> buttons;
    juce::ComboBox preset,division;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> divisionAttachment;
    juce::TextButton advanced{"Advanced"},save{"Save preset"},load{"Load preset"};
    juce::Label meters,status;
    bool expanded=false;
    std::unique_ptr<juce::FileChooser> chooser;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(TMVocalEditor)
};
