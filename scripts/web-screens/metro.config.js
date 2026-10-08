const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
const orig = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, name, platform) => {
  if (platform === "web" && name === "react-native-android-widget") {
    return { type: "sourceFile", filePath: path.join(__dirname, "webshim/android-widget.js") };
  }
  if (platform === "web" && name === "expo-notifications") {
    return { type: "sourceFile", filePath: path.join(__dirname, "webshim/notifications.js") };
  }
  return orig ? orig(ctx, name, platform) : ctx.resolveRequest(ctx, name, platform);
};
module.exports = config;
