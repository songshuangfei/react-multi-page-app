'use strict';
//env
process.env.NODE_ENV = "production";

const fs = require("fs");
const webpack = require("webpack");
const paths = require("../config/paths")
const { cleanDir } = require("../config/utils")
const configFactory = require("../config/webpack.config");

cleanDir(fs, paths.outputPath);

// complier
const webpackConfig = configFactory({ mode: "production" });
const compiler = webpack(webpackConfig);
compiler.run((err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }
  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors[0]);
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
})
