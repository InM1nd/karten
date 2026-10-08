set -ex
mkdir -p ~/opt && cd ~/opt
if [ ! -d jdk17 ]; then
  curl -fsSL -o jdk.tgz "https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jdk/hotspot/normal/eclipse"
  mkdir jdk17 && tar xzf jdk.tgz -C jdk17 --strip-components=1 && rm jdk.tgz
fi
export JAVA_HOME=~/opt/jdk17 PATH=~/opt/jdk17/bin:$PATH
java -version
mkdir -p ~/Android/Sdk/cmdline-tools
if [ ! -d ~/Android/Sdk/cmdline-tools/latest ]; then
  curl -fsSL -o clt.zip https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip
  unzip -q clt.zip -d ~/Android/Sdk/cmdline-tools && mv ~/Android/Sdk/cmdline-tools/cmdline-tools ~/Android/Sdk/cmdline-tools/latest && rm clt.zip
fi
export ANDROID_HOME=~/Android/Sdk
yes | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --licenses >/dev/null || true
~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "build-tools;35.0.0" "platforms;android-35"
echo INSTALL_DONE
