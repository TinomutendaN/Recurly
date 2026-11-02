const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const nativewindConfig = withNativewind(config);

// react-native-css aliases every `react-native` import to its own wrapper, which
// (as of 3.1.0-rc.1) doesn't re-export `AssetRegistry`. expo-asset needs it to
// load fonts/images on SDK 58, so let expo-asset import the real react-native.
// Remove once react-native-css ships a wrapper that includes AssetRegistry.
const nativewindResolve = nativewindConfig.resolver.resolveRequest;
nativewindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react-native" &&
    /[\\/]node_modules[\\/]expo-asset[\\/]/.test(context.originModulePath)
  ) {
    return context.resolveRequest(context, moduleName, platform);
  }
  return nativewindResolve
    ? nativewindResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = nativewindConfig;
