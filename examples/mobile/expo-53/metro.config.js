// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
// const path = require("node:path");

// const accountMessageBridgeDir = path.resolve(__dirname, "../../../packages/account-message-bridge");
// const accountReactNativeDir = path.resolve(__dirname, "../../../packages/account-react-native");
// const accountCoreDir = path.resolve(__dirname, "../../../packages/account-core");
// const accountConnectorDir = path.resolve(
//   __dirname,
//   "../../packages/account-connector"
// );
// const zksyncSsoDir = path.resolve(
//   __dirname,
//   "../../../zksync-sso/packages/sdk"
// );

const extraNodeModules = {
  // "@sophon-labs/account-message-bridge": accountMessageBridgeDir,
  // "@sophon-labs/account-react-native": accountReactNativeDir,
  // "@sophon-labs/account-core": accountCoreDir,
  // "@sophon-labs/account-connector": accountConnectorDir,
  // "zksync-sso": zksyncSsoDir,
};
const watchFolders = [
  // accountMessageBridgeDir,
  // accountReactNativeDir,
  // accountCoreDir,
  // accountConnectorDir,
  // zksyncSsoDir,
];

// const poly = require("expo-crypto-polyfills");

const developConfig = {
  watchFolders: watchFolders,
  resolver: {
    // extraNodeModules: new Proxy(extraNodeModules, {
    //   get: (target, name) => {
    //     console.log("requestion", name);
    //     // if its one of the local packages, return the mapped path
    //     if (name in target) {
    //       return target[name];
    //     }

    //     if (name in Object.keys(poly)) {
    //       return poly[name];
    //     }

    //     // default node_modules path
    //     return path.join(process.cwd(), `node_modules/${name}`);
    //   },
    // }),
    // @see https://github.com/pmndrs/zustand/discussions/1967
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.includes("zustand")) {
        const result = require.resolve(moduleName); // gets CommonJS version
        return context.resolveRequest(context, result, platform);
      }
      // otherwise chain to the standard Metro resolver.
      return context.resolveRequest(context, moduleName, platform);
    },
    // unstable_enableSymlinks: true,  // defaults to true since Metro v0.79.0
  },
  // resetCache: true, // https://metrobundler.dev/docs/configuration/#resetcache
};

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    ...developConfig.resolver,
    extraNodeModules: require("expo-crypto-polyfills"),
    // extraNodeModules: {
    //   ...config.resolver.extraNodeModules,
    //   ...developConfig.resolver.extraNodeModules,
    //   ...require("expo-crypto-polyfills"),
    // },
  },
  watchFolders: [...config.watchFolders, ...developConfig.watchFolders],
  resetCache: true,
};
