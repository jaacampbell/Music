#include "PluginEditor.h"
TMVocalEditor::TMVocalEditor(TMVocalProcessor& p):AudioProcessorEditor(p),processor(p) {
    const auto accent=juce::Colour(0xffb0cc00);
    skin.setColour(juce::Slider::rotarySliderFillColourId,accent);
    skin.setColour(juce::Slider::thumbColourId,accent);
    skin.setColour(juce::TextButton::buttonColourId,juce::Colour(0xff262b31));
    skin.setColour(juce::ComboBox::backgroundColourId,juce::Colour(0xff262b31));
    skin.setColour(juce::ToggleButton::tickColourId,accent);setLookAndFeel(&skin);
    constexpr std::array<const char*,12> ids{"input","body","presence","threshold","ratio","deess","drive","reverb","delay","time","mix","output"};
    constexpr std::array<const char*,12> names{"INPUT","BODY","PRESENCE","COMPRESS","RATIO","DE-ESS","DRIVE","REVERB","DELAY","TIME","MIX","OUTPUT"};
    for(size_t i=0;i<knobs.size();++i) {
        auto& k=knobs[i];k.setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
        k.setTextBoxStyle(juce::Slider::TextBoxBelow,false,90,22);addAndMakeVisible(k);
        labels[i].setText(names[i],juce::dontSendNotification);labels[i].setJustificationType(juce::Justification::centred);addAndMakeVisible(labels[i]);
        sliders.push_back(std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(p.state,ids[i],k));
    }
    constexpr std::array<const char*,9> toggleIds{"eq","comp","ess","sat","space","echo","bypass","tracking","sync"};
    constexpr std::array<const char*,9> toggleNames{"EQ","Dynamics","De-ess","Saturation","Reverb","Delay","Bypass","Tracking","Tempo sync"};
    for(size_t i=0;i<toggles.size();++i) {
        toggles[i].setButtonText(toggleNames[i]);addAndMakeVisible(toggles[i]);
        buttons.push_back(std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment>(p.state,toggleIds[i],toggles[i]));
    }
    preset.addItemList(juce::StringArray{"Neutral Start","Baritone Forward","Dry Southern Lead","Wide Hook"},1);
    preset.setText("Choose a starting point",juce::dontSendNotification);
    preset.onChange=[this]{if(preset.getSelectedId()>0) processor.applyPreset(preset.getSelectedId()-1);presetNotice.clear();};addAndMakeVisible(preset);
    division.addItemList(juce::StringArray{"1/4","1/8","1/8 dotted","1/16"},1);addAndMakeVisible(division);
    divisionAttachment=std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment>(p.state,"division",division);
    advanced.onClick=[this]{expanded=!expanded;advanced.setButtonText(expanded?"Simple":"Advanced");resized();};
    save.onClick=[this]{chooseFile(true);};load.onClick=[this]{chooseFile(false);};
    for(auto* b:{&advanced,&save,&load}) addAndMakeVisible(b);
    addAndMakeVisible(meters);addAndMakeVisible(status);
    setSize(880,550);startTimerHz(20);
}
TMVocalEditor::~TMVocalEditor() { stopTimer();setLookAndFeel(nullptr); }
void TMVocalEditor::paint(juce::Graphics& g) {
    g.fillAll(juce::Colour(0xff111418));g.setColour(juce::Colour(0xffb0cc00));
    g.setFont(juce::FontOptions(30.0f,juce::Font::bold));g.drawText("TM VOCAL",28,18,300,45,juce::Justification::centredLeft);
    g.setColour(juce::Colour(0xffadb4bc));g.setFont(juce::FontOptions(14.0f));
    g.drawText("VOICE FIRST. BUILT FOR YOUR POCKET.",30,63,500,24,juce::Justification::centredLeft);
    g.setColour(juce::Colour(0xff1b2026));g.fillRoundedRectangle(20,142,840,310,12);
    g.setColour(juce::Colour(0xffadb4bc));
    g.drawText("EQ  >  COMPRESSION  >  DE-ESS  >  SATURATION  >  SPACE",28,455,824,22,juce::Justification::centred);
}
void TMVocalEditor::resized() {
    preset.setBounds(30,104,260,30);load.setBounds(310,104,112,30);save.setBounds(430,104,112,30);advanced.setBounds(720,104,130,30);
    constexpr std::array<int,6> simple{0,3,5,6,7,11};
    for(size_t i=0;i<knobs.size();++i) {
        const auto found=std::find(simple.begin(),simple.end(),static_cast<int>(i));
        const bool shown=expanded||found!=simple.end();knobs[i].setVisible(shown);labels[i].setVisible(shown);
        const int slot=expanded?static_cast<int>(i):static_cast<int>(found-simple.begin());
        const int x=32+(slot%6)*138,y=expanded?160+(slot/6)*142:225;
        labels[i].setBounds(x,y,126,22);knobs[i].setBounds(x,y+25,126,108);
    }
    for(size_t i=0;i<toggles.size();++i) {
        const bool shown=expanded||i==6||i==7;toggles[i].setVisible(shown);
        if(i<6) toggles[i].setBounds(28+static_cast<int>(i)*138,483,135,24);
        else toggles[i].setBounds(28+static_cast<int>(i-6)*155,514,150,24);
    }
    division.setVisible(expanded);division.setBounds(496,513,100,25);
    meters.setBounds(530,27,320,55);status.setBounds(610,513,240,26);
}
void TMVocalEditor::timerCallback() {
    auto db=[](float x){return juce::String(20*std::log10(std::max(x,1.0e-6f)),1);};
    meters.setText("IN "+db(processor.inputMeter.load())+" dBFS    OUT "+db(processor.outputMeter.load())+" dBFS\nGAIN REDUCTION "+juce::String(processor.gainReduction.load(),1)+" dB",juce::dontSendNotification);
    status.setText(presetNotice.isNotEmpty()?presetNotice:(toggles[7].getToggleState()?"Tracking: space muted":"0 added latency"),juce::dontSendNotification);
}
void TMVocalEditor::chooseFile(bool saving) {
    chooser=std::make_unique<juce::FileChooser>(saving?"Save TM Vocal preset":"Load TM Vocal preset",juce::File::getSpecialLocation(juce::File::userDocumentsDirectory),"*.tmvocal");
    juce::Component::SafePointer<TMVocalEditor> safe(this);
    chooser->launchAsync((saving?juce::FileBrowserComponent::saveMode|juce::FileBrowserComponent::warnAboutOverwriting:juce::FileBrowserComponent::openMode)|juce::FileBrowserComponent::canSelectFiles,
        [safe,saving](const juce::FileChooser& fc){if(safe==nullptr) return;
            auto file=fc.getResult();if(file==juce::File{}) return;
            if(saving) safe->presetNotice=safe->processor.savePreset(file.withFileExtension("tmvocal"))?"Preset saved":"Could not save preset";
            else safe->presetNotice=safe->processor.loadPreset(file)?"Preset loaded":"Invalid preset";
        });
}
