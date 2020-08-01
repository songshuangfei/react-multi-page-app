/**
 * 客户端websocket链接代码
 * 在开发中这里的代码会被嵌入html模板
 */
(function () {
  var host = window.location.host;
  var pathname = window.location.pathname;
  var ws = new WebSocket("ws://" + host + pathname);
  ws.onerror = function () { showErrorBoard("websocket closed, please reload") };
  ws.onclose = function () { showErrorBoard("websocket closed, please reload") };
  ws.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    switch (data.type) {
      case "reload":
        window.location.reload();
        break;
      case "error":
        showErrorBoard(data.errors);
        break;
    }
  }

  var errorBoard = document.createElement("div");
  errorBoard.style = "width:100vw;" +
    "height: 100vh;" +
    "position: absolute;" +
    "left: 0;" +
    "top: 0;" +
    "z-index: 999;" +
    "padding: 20px;" +
    "box-sizing: border-box;" +
    "background: #fff;" +
    "display: none";
  document.body.appendChild(errorBoard);

  var errorMsgTemplate = document.createElement("pre");
  errorMsgTemplate.style = "padding: 10px;" +
    "color: red;" +
    "background: #fff5f7;" +
    "border-radius: 4px;";

  function showErrorBoard(errors) {
    errorBoard.innerHTML = "";
    if (typeof errors === "string") {
      var errorMsg = errorMsgTemplate.cloneNode(false);
      errorMsg.innerHTML = errors;
      errorBoard.appendChild(errorMsg);
      errorBoard.style.display = "block";
      return;
    }
    if (errors instanceof Array) {
      errors.forEach(err => {
        var errorMsg = errorMsgTemplate.cloneNode(false);
        errorMsg.innerHTML = err;
        errorBoard.appendChild(errorMsg)
      });
      errorBoard.style.display = "block";
      return;
    }
    
  }

  function closeErrorBoard(msg) {
    document.body.removeChild(errorDom);
  }
})()
