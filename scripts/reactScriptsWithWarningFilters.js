process.env.GENERATE_SOURCEMAP = "false";
process.noDeprecation = true;

const webpackConfigPath = require.resolve("react-scripts/config/webpack.config");
const createWebpackConfig = require(webpackConfigPath);

require.cache[webpackConfigPath].exports = (...args) => {
  const config = createWebpackConfig(...args);

  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    {
      module: /node_modules[\\/]viem[\\/]node_modules[\\/]ox[\\/].*virtualMasterPool\.js$/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
    {
      module: /node_modules[\\/]@metamask[\\/]sdk[\\/]/,
      message: /Can't resolve '@react-native-async-storage\/async-storage'/,
    },
  ];

  return config;
};
