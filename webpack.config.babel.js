import path from "path";

export default {
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
