/**
 * 客户端websocket链接代码
 * 在开发中这里的代码会被嵌入html模板
 */
(function () {
  var errorDom = document.createElement("div");
  errorDom.style = "width:100vw;" +
    "height: 100vh;" +
    "position: absolute;" +
    "left: 0;" +
    "top: 0;" +
    "z-index: 999;" +
    "padding: 20px;" +
    "box-sizing: border-box;" +
    "background: #fff;";
  var errorMsg = document.createElement("pre");
  errorMsg.style = "padding: 10px;" +
    "color: red;" +
    "background: #fff5f7;" +
    "border-radius: 4px;";
  errorDom.appendChild(errorMsg);

  var host = window.location.host;
  var pathname = window.location.pathname;
  var ws = new WebSocket("ws://" + host + pathname);
  ws.onerror = function () {
    console.log("websocket 已断开，请刷新页面")
  }


  ws.onclose = function () {
    console.log("websocket 已断开，请刷新页面")
  }
  ws.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    switch (data.type) {
      case "reload":
        window.location.reload();
        break;
      case "error":
        errorMsg.innerText = data.errors;
        document.body.appendChild(errorDom);
        break;
    }
  }

})()
