const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_conditionNames = [
  "react-native",
  ...(config.resolver.unstable_conditionNames ?? []),
];

config.resolver.sourceExts.push('css');
config.resolver.assetExts.push('wasm');

module.exports = withNativewind(config, {
  inlineVariables: false,
  globalClassNamePolyfill: false,
});
