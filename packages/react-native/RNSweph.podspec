require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNSweph"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/astro-fusion/af-sweph.git", :tag => "v#{s.version}" }

  s.compiler_flags = '-Wno-strict-prototypes -Wno-shorten-64-to-32 -Wno-unreachable-code -Wno-conditional-uninitialized'

  xcframework_path = File.join(__dir__, "ios", "SwissEph.xcframework")
  if File.exist?(xcframework_path)
    s.vendored_frameworks = "ios/SwissEph.xcframework"
    s.source_files = "ios/**/*.{h,m,mm}", "cpp/**/*.{h,cpp}"
  else
    s.source_files = "ios/**/*.{h,m,mm}", "cpp/**/*.{h,cpp}", "swisseph/lib/*.{c,h}"
  end

  # React Native dependencies
  install_modules_dependencies(s)
end
