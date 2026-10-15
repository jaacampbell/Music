cmake_minimum_required(VERSION 3.16)
project(TMStemDirectorClient VERSION 0.1.0 LANGUAGES CXX)

# Loopback CLI and unit tests only. This project must not install or replace a VST3.
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(tm_stem_bridge_client STATIC src/BridgeClient.cpp)
target_include_directories(tm_stem_bridge_client PUBLIC include)
if(WIN32)
  target_link_libraries(tm_stem_bridge_client PUBLIC ws2_32)
endif()
if(MSVC)
  target_compile_options(tm_stem_bridge_client PRIVATE /W4)
else()
  target_compile_options(tm_stem_bridge_client PRIVATE -Wall -Wextra -Wpedantic)
endif()

add_executable(tm_stem_client src/main.cpp)
target_link_libraries(tm_stem_client PRIVATE tm_stem_bridge_client)

include(CTest)
if(BUILD_TESTING)
  add_executable(tm_stem_client_tests tests/ClientTests.cpp)
  target_link_libraries(tm_stem_client_tests PRIVATE tm_stem_bridge_client)
  add_test(NAME tm_stem_client_tests COMMAND tm_stem_client_tests)
endif()
