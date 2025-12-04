const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const path = require('node:path');

const accountMessageBridgeDir = path.resolve(
  __dirname,
  '../../../packages/account-message-bridge',
);
const accountReactNativeDir = path.resolve(
  __dirname,
  '../../../packages/account-react-native',
);
const accountCoreDir = path.resolve(
  __dirname,
  '../../../packages/account-core',
);
const accountCommunicatorDir = path.resolve(
  __dirname,
  '../../../packages/account-communicator',
);
const accountProviderDir = path.resolve(
  __dirname,
  '../../../packages/account-provider',
);
const partnerProviderDir = path.resolve(
  __dirname,
  '../../../packages/account-partner',
);
const accountConnectorDir = path.resolve(
  __dirname,
  '../../../packages/account-connector',
);

const extraNodeModules = {
  '@sophon-labs/account-message-bridge': accountMessageBridgeDir,
  '@sophon-labs/account-react-native': accountReactNativeDir,
  '@sophon-labs/account-core': accountCoreDir,
  '@sophon-labs/account-communicator': accountCommunicatorDir,
  '@sophon-labs/account-connector': accountConnectorDir,
  '@sophon-labs/account-provider': accountProviderDir,
  '@sophon-labs/account-partner': partnerProviderDir,
};
const watchFolders = [
  accountMessageBridgeDir,
  accountReactNativeDir,
  accountCoreDir,
  accountCommunicatorDir,
  accountConnectorDir,
  accountProviderDir,
  partnerProviderDir,
];

const developConfig = {
  watchFolders: watchFolders,
  resolver: {
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) => {
        // if its one of the local packages, return the mapped path
        if (name in target) {
          return target[name];
        }

        // default node_modules path
        return path.join(process.cwd(), `node_modules/${name}`);
      },
    }),
    // @see https://github.com/pmndrs/zustand/discussions/1967
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.includes('zustand')) {
        const result = require.resolve(moduleName); // gets CommonJS version
        return context.resolveRequest(context, result, platform);
      }
      // otherwise chain to the standard Metro resolver.
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);
const modulesConfig = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    ...developConfig.resolver,
  },
  watchFolders: [...defaultConfig.watchFolders, ...developConfig.watchFolders],
  //   resetCache: true,
};

module.exports = withNativeWind(modulesConfig, { input: './app/global.css' });
