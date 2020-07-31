'use strict';

const path = require("path");
const http = require("http");
const fs = require("fs");
const url = require("url")
const paths = require("./paths");
const {
  getFoldersOfPathSync,
  isFile,
  isPathExist,
  readFile,
  getFileContentAndMIME,
} = require("./utils");

const wsClientJS = fs.readFileSync(path.resolve(paths.rootDir, "config/wsClient.js"))

function createRes(res) {
  return {
    resContent(content, type) {
      res.writeHead(200, { "Content-Type": type });
      res.end(content);
    },
    resNotFound() {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    },
    resError() {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 Internal Server Error");
    }
  }
}

module.exports = function (port, host, publicDir, mfs) {
  const server = http.createServer(async (req, res) => {
    const response = createRes(res);
    try {
      // 返回前端链接websocket的脚本
      if (req.url === `/wsClient.js`)
        return response.resContent(wsClientJS, "text/javascript");

      // 先检查是否匹配到页面路由, 如 “/login” 或 “/login/*”
      const pageName = url.parse(req.url).path.split("/")[1];
      const isPage = getFoldersOfPathSync(fs, paths.pagesRoot).includes(pageName);
      if (isPage) {
        let resHtml;
        const pageHtmlPath = paths.getDevPageHtmlOutputPath(pageName);
        const exist = await isPathExist(mfs, pageHtmlPath);
        if(exist){
          // 如果编译的html存在，则从内存中读取并返回这个html
          resHtml = await readFile(mfs, pageHtmlPath);
        }else{
          // 如果没有编译好的html，就返回一个等待编译的模板页面
          resHtml = await readFile(fs, paths.getHtmlTemplatePath("compiling"));
        }
        return response.resContent(resHtml, "text/html");
      }

      // 匹配内存文件系统内打包的文件
      const isAMFSFile = await isFile(mfs, path.join(paths.devOutputPath, req.url));
      if (isAMFSFile) {
        const contentAndType = await getFileContentAndMIME(mfs, path.join(paths.devOutputPath, req.url))
        return response.resContent(contentAndType.content, contentAndType.type);
      }

      // 匹配 public下的文件
      const isANormalFile = await isFile(fs, path.join(publicDir, req.url));
      if (isANormalFile) {
        const contentAndType = await getFileContentAndMIME(fs, path.join(publicDir, req.url));
        return response.resContent(contentAndType.content, contentAndType.type);
      }

      //页面和文件都未匹配到，返回404
      response.resNotFound();
    } catch (error) {
      console.log(error);
      return response.resError();
    }
  }).listen(port, host);
  return server;
}