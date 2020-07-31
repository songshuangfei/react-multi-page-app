'use strict';
// env
process.env.NODE_ENV = "development";

const events = require("events");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const WebSocket = require('ws');

const paths = require("../config/paths")
const configFactory = require("../config/webpack.config");
const createServer = require("../config/server");

const port = 3000;
const host = "0.0.0.0";

// 用于开发中文件输出到内存的文件系统
const mfs = new MemoryFS();

// 储存各个页面的compiler.watch, 返回的watching
const pagesCompilerWatching = new Map();
// websocket 链接
//Array<{pageName:string, connection: webSocketConnection}>
let wsConnections = [];

// 每个页面在编译后的会触发
const compilerEventEmitter = new events.EventEmitter();
// 在编译后发生错误出触发
compilerEventEmitter.on("error", (pageName, err) => {
  wsConnections.forEach(con => {
    if (con.pageName === pageName) {
      con.connection.send(JSON.stringify({ type: "error", errors: err[0] }))
    }
  })
});
// 编译成功后触发
compilerEventEmitter.on("succeed", (pageName, stats) => {
  wsConnections.forEach(con => {
    if (con.pageName === pageName) {
      con.connection.send(JSON.stringify({ type: "reload" }))
    }
  })
})

const server = createServer(port, host, paths.publicRoot, mfs);
const wss = new WebSocket.Server({ server });

wss.on("connection", (connection, req) => {
  const pageName = req.url.split('/')[1];
  const con = { pageName, connection };
  // 保存链接和页面名， 页面名用于页面编译后的推送
  wsConnections.push(con);
  // 当链接错误，清除链接引用
  connection.on("error", (err) => {
    console.log(err);
    connection.close();
  });
  // 当连接关闭后， 清除链接引用
  connection.on("close", () => {
    wsConnections = wsConnections.filter(c => c !== con);
  })
  // 如果没有当前页面的编译器，就创建编译器
  if(!pagesCompilerWatching.has(pageName))
    createCompiler(pageName);
})

// 根据页面名创建编译器，并返回watching
function createCompiler(pageName) {
  // 创建一个页面的编译器
  const compiler = webpack(configFactory({ mode: "development", pageName }));
  // 将编译器的输出定向到内存
  compiler.outputFileSystem = mfs;
  // 开启文件监听
  const watching = compiler.watch({ xaggregateTimeout: 500 }, (err, stats) => {
    if (err) return console.log(err.details);
    const info = stats.toJson();
    if (stats.hasWarnings()) console.warn(info.warnings);
    if (stats.hasErrors()){
      compilerEventEmitter.emit('error', pageName, info.errors)
    }else{
      compilerEventEmitter.emit('succeed', pageName, stats);
    }
  });
  pagesCompilerWatching.set(pageName, watching);
}





