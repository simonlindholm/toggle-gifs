import path from "path";

export default (env, options) => {
  const isDevelopment = options.mode === "development";
  const devtool = isDevelopment ? "cheap-source-map" : "hidden-source-map";

  return {
    devtool,
    context: path.resolve(__dirname, "src"),
    entry: {
      background: "./background.js",
      content: "./content.js",
      settings: "./settings.js"
    },
    output: {
      path: path.join(__dirname, "extension", "dist"),
      filename: "[name].js"
    }
  };
};
