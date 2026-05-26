const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix: React 19 ESM/CJS compatibility with Metro bundler
// The error overlay in @expo/metro-runtime imports React as ESM namespace
// but Metro resolves it as CJS (React.default)
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  resolveRequest: (context, moduleName, platform) => {
    // Force React and ReactDOM to be resolved as ESM
    if (moduleName === 'react' || moduleName === 'react-dom') {
      // Let Metro use the default resolution which should use exports field
      // when unstable_enablePackageExports is true
      return context.resolveRequest
        ? context.resolveRequest(context, moduleName, platform)
        : require('metro-resolver').resolve(
            { ...context, preferNativePlatform: true },
            moduleName,
            platform
          );
    }
    return context.resolveRequest
      ? context.resolveRequest(context, moduleName, platform)
      : require('metro-resolver').resolve(context, moduleName, platform);
  },
};

module.exports = config;
