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
// 储存各个页面的compiler.watch()返回的watching
const pagesCompilerWatching = new Map();
// websocket连接,储存每个连接的socke，用于向页面发送刷新通知或者错误信息
// Array<{pageName:string, connection: webSocketConnection}>
let wsConnections = [];

// 每个页面在编译后的会触发这个eventEmitter的事件
const compilerEventEmitter = new events.EventEmitter();
// 编译成功后触发
compilerEventEmitter.on("succeed", (pageName, stats) => {
  wsConnections.forEach(con => {
    // 仅仅向连接到本页面的socket发送刷新页面的通知
    if (con.pageName === pageName) {
      con.connection.send(JSON.stringify({ type: "reload" }))
    }
  })
});
// 在编译后发生错误出触发
compilerEventEmitter.on("error", (pageName, err) => {
  wsConnections.forEach(con => {
    // 仅仅向连接到本页面的socket发送编译的错误信息
    if (con.pageName === pageName) {
      con.connection.send(JSON.stringify({ type: "error", errors: err }))
    }
  })
});

// 创建http服务，将内存中打包的文件和public下的文件都作为http静态资源
// 同时会将"config/wsClient.js" 放在url"/wsClient.js"下，用于前端加载脚本建立websocket
const server = createServer(port, host, paths.publicRoot, mfs, pagesCompilerWatching);
// websocket服务，页面加载后会连接，等待更新或错误通知
const wss = new WebSocket.Server({ server });

wss.on("connection", (connection, req) => {
  const pageName = req.url.split('/')[1];
  const con = { pageName, connection };
  // 保存连接和页面名，页面名用于页面编译后按页面名称分别推送更新或错误信息
  wsConnections.push(con);
  // 当链接错误，清除链接引用
  connection.on("error", (err) => {
    console.log(err);
    connection.close();
    wsConnections = wsConnections.filter(c => c !== con);
  });
  // 当连接关闭后， 清除链接引用
  connection.on("close", () => {
    wsConnections = wsConnections.filter(c => c !== con);
  })

  // 连接后如果没有当前页面的编译器，就创建编译器
  // 否则页面永远也等不到编译器触发的更新通知
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
    if (stats.hasErrors()){
      compilerEventEmitter.emit('error', pageName, info.errors);
      console.log(info.errors[0]);
    }else{
      compilerEventEmitter.emit('succeed', pageName, stats);
      console.clear();
      console.log(`Page "${pageName}" compiled succeed in ${info.time}ms\n`);
      if (stats.hasWarnings()) console.warn(info.warnings);
      console.log(`Open in your browser: http://localhost:${port}/${pageName}`);
    }
  });
  pagesCompilerWatching.set(pageName, watching);
}

// 每隔一段时间检查一次是否需要清理未使用的编译器
setInterval(() => {
   // 编译器数量为0，无需清理
  if(pagesCompilerWatching.size === 0) return;
  if(wsConnections.length === 0){
    // 连接数为0，关闭并清理所有编译器
    pagesCompilerWatching.forEach((watching)=>watching.close());
    pagesCompilerWatching.clear();
    return;
  }
  // 统计每一个编译器的连接数量
  const counter = {};
  pagesCompilerWatching.forEach((_, pageName) => counter[pageName] = 0);
  wsConnections.forEach(con => counter[con.pageName]++);
  Reflect.ownKeys(counter).forEach(pageName=>{
    if(counter[pageName] === 0){
      pagesCompilerWatching.get(pageName).close();
      pagesCompilerWatching.delete(pageName);
    }
  })
}, 30 * 1000);