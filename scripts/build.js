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
  if (err) return console.error(err.details);
  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.clear();
    return console.error(info.errors[0]);
  }
  if (stats.hasWarnings()) console.warn(info.warnings);
  console.log(`compiled succeed in ${info.time}ms`);
})
