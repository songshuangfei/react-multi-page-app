import React, { useState, lazy, Suspense } from "react";
import ReactDom from "react-dom";
import "./home.css";
const ButtonAsync = lazy(()=>import("Component/Button")) ;

function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h4>Home Page...</h4>
      <div>count: {count}</div>
      <Suspense fallback="loading...">
        <ButtonAsync onClick={() => setCount(count + 1)}>Add</ButtonAsync>
      </Suspense>
    </div>
  )
}

ReactDom.render(
  <App />,
  document.getElementById("root")
)