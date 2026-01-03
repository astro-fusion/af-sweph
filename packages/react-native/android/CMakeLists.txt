cmake_minimum_required(VERSION 3.18.0)

project(rnsweph)

add_library(rnsweph SHARED
  cpp/RNSwephImpl.cpp
  cpp/RNSwephImpl.h
)

# Link against React Native
target_link_libraries(rnsweph
  fbjni
  folly_runtime
  glog
  jsi
  react_nativemodule_core
)
