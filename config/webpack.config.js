const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const paths = require("./paths");
const { getFoldersOfPathSync, readJsonSync } = require("./utils");

function getPageParameters(pageName) {
  const pageInfo = readJsonSync(fs, paths.getPageConfigJsonPath(pageName));
  const {
    title,
    description,
    keywords
  } = pageInfo
  return {
    title: title || "",
    description: description || "",
    keywords: keywords.length ? keywords.join(",") : ""
  }
}

module.exports = function ({ mode, pageName }) {
  const isDev = mode === "development";
  let entry;
  let htmlPlugins = [];
  if (isDev) {
    // 开发状态中只会有一个入口
    // 会在某个页面的websocke链接后, 开启页面的编译器
    // 一个页面的的编译器会为多个socket服务, 但每一个页面只会有一个编译器
    entry = paths.getPageEntryPath(pageName);
    
    //为页面创建html
    htmlPlugins.push(new HtmlWebpackPlugin({
      filename: paths.getDevPageHtmlOutputPath(pageName),
      template: paths.getHtmlTemplatePath("page"),
      templateParameters: {
        wsClientScript: `<script src="/wsClient.js"></script>`,
        ...getPageParameters(pageName)
      }
    }));
  } else {
    // build 时只会有一个编译器，多个入口编译
    entry = {};
    getFoldersOfPathSync(fs, paths.pagesRoot).forEach(name => {
      entry[name] = paths.getPageEntryPath(name);
      // 为每一个页面创建html
      htmlPlugins.push(new HtmlWebpackPlugin({
        chunks: [name],
        filename: paths.getPageHtmlOutputPath(name),
        template: paths.getHtmlTemplatePath("page"),
        templateParameters: getPageParameters(name)
      }))
    })
  }

  return {
    mode,
    entry,
    output: {
      path: isDev
        ? path.resolve(paths.devOutputPath, "js", pageName)
        : path.resolve(paths.outputPath, 'js'),
      filename: isDev ? "bundle.js" : "[name].[chunkhash].js",
      // 开发中的js输出不会有hash，所以要按文件夹名区分
      publicPath: isDev ? `/js/${pageName}/` : "/js/"
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      ...htmlPlugins
    ]
  }
};
