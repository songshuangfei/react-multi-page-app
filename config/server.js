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

const wsClientJS = fs.readFileSync(path.resolve(paths.rootDir, "config/wsClient.js"));
const pageListTemplate = fs.readFileSync(paths.getHtmlTemplatePath("page-list"));

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

function renderPageList(pagesCompilerWatching){
  const pageListValStr = JSON.stringify(getFoldersOfPathSync(fs, paths.pagesRoot));
  const compilerListValStr = JSON.stringify(Array.from(pagesCompilerWatching.keys()));
  const res = String(pageListTemplate).replace("{{pageNameArray}}", pageListValStr)
    .replace("{{compilerListArray}}", compilerListValStr)
  return res
}

module.exports = function (port, host, publicDir, mfs, pagesCompilerWatching) {
  const server = http.createServer(async (req, res) => {
    const response = createRes(res);
    // 这个服务只会返回文件资源，统一默认http请求是GET请求
    try {
      // 如果是根路由就返回一个页面展示，当前已经创建的页面列表
      if(req.url === "/")
        return response.resContent(renderPageList(pagesCompilerWatching), "text/html");
      
      // 返回前端链接websocket的脚本
      if (req.url === `/wsClient.js`)
        return response.resContent(wsClientJS, "text/javascript");

      // 先检查是否匹配到页面路由, 如 “/login” 或 “/login/*”
      const pageName = url.parse(req.url).path.split("/")[1];
      const isPage = getFoldersOfPathSync(fs, paths.pagesRoot).includes(pageName);
      if (isPage) {
        // 如果是页面路由就要返回编译好的html
        // 如果html不存在说明就还未编译过，就返回一个等待编译的页面
        let resHtml;// 将要返回给前端的html内容
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

      // 如果不是页面路由，就向下匹配
      
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
  }).listen(port, host, () => {
    console.log(`Server is running.\n \nOpen in your browser: http://localhost:${port}`);
  });
  return server;
}