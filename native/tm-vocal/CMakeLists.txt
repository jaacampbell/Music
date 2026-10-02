cmake_minimum_required(VERSION 3.22)
project(TMVocal VERSION 0.1.0 LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
option(TM_BUILD_PLUGIN "Build JUCE plugin wrappers" ON)
include(CTest)
add_executable(tm_vocal_dsp_tests tests/DspTests.cpp)
target_include_directories(tm_vocal_dsp_tests PRIVATE src)
add_test(NAME tm_vocal_dsp COMMAND tm_vocal_dsp_tests)
if(NOT TM_BUILD_PLUGIN)
  return()
endif()
set(TM_JUCE_SOURCE "" CACHE PATH "Existing JUCE 8 source checkout")
if(TM_JUCE_SOURCE)
  add_subdirectory("${TM_JUCE_SOURCE}" "${CMAKE_BINARY_DIR}/JUCE")
else()
  include(FetchContent)
  FetchContent_Declare(JUCE
    URL https://codeload.github.com/juce-framework/JUCE/tar.gz/29396c22c93392d6738e021b83196283d6e4d850
    URL_HASH SHA256=97cc01e0fe15278f6edadc895a3cf0aac2fd98bcd023823384d5ca7025beb91c
    DOWNLOAD_EXTRACT_TIMESTAMP FALSE)
  FetchContent_MakeAvailable(JUCE)
endif()
set(TM_FORMATS VST3 Standalone)
if(APPLE)
  list(APPEND TM_FORMATS AU)
endif()
juce_add_plugin(TMVocal
  COMPANY_NAME "TM Music Studio" BUNDLE_ID "com.tmmusicstudio.vocal"
  PLUGIN_MANUFACTURER_CODE TmMs PLUGIN_CODE TmVo
  FORMATS ${TM_FORMATS} PRODUCT_NAME "TM Vocal"
  IS_SYNTH FALSE NEEDS_MIDI_INPUT FALSE NEEDS_MIDI_OUTPUT FALSE
  IS_MIDI_EFFECT FALSE VST3_CATEGORIES Fx Dynamics EQ
  COPY_PLUGIN_AFTER_BUILD FALSE)
target_sources(TMVocal PRIVATE src/PluginProcessor.cpp src/PluginEditor.cpp)
target_compile_definitions(TMVocal PUBLIC JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0 JUCE_VST3_CAN_REPLACE_VST2=0)
target_link_libraries(TMVocal PRIVATE juce::juce_audio_utils
  PUBLIC juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)
juce_add_console_app(tm_vocal_processor_tests PRODUCT_NAME "TM Vocal processor tests")
target_sources(tm_vocal_processor_tests PRIVATE tests/ProcessorTests.cpp)
target_include_directories(tm_vocal_processor_tests PRIVATE src)
target_compile_definitions(tm_vocal_processor_tests PRIVATE JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0)
target_link_libraries(tm_vocal_processor_tests PRIVATE TMVocal juce::juce_audio_utils)
add_test(NAME tm_vocal_processor COMMAND tm_vocal_processor_tests)
