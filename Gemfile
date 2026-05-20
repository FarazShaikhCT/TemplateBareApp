source 'https://rubygems.org'

# You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
ruby ">= 2.6.10"

# Align with CI (CocoaPods 1.16.x).
gem 'cocoapods', '>= 1.16', '< 1.17'
gem 'activesupport', '>= 6.1.7.5', '!= 7.1.0'
gem 'xcodeproj', '>= 1.27.0', '< 2.0'
gem 'concurrent-ruby', '< 1.3.4'

# Ruby 3.4.0 has removed some libraries from the standard library.
gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'
gem 'nkf'

# Fastlane (CI: Firebase / TestFlight) — GitHub Actions uses Ruby 3.2 + Bundler 2.4.x
gem "fastlane", "~> 2.225"
