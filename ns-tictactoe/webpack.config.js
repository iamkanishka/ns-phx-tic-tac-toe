const webpack = require("@nativescript/webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env) => {
  webpack.init(env);

  // ✅ Ensure the assets folder (e.g., sounds) is copied to /app/assets
  webpack.chainWebpack((config) => {
    config.plugin("CopyAssets").use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: "assets", // your folder under src/
            to: "assets",   // destination inside app/
          },
        ],
      },
    ]);
  });

  return webpack.resolveConfig();
};
