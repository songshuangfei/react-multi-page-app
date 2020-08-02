import React, { FC } from "react";
import "./button.css"

const Button:FC<{onClick: ()=>void}> =(props)=>{
  return (
    <div onClick={props.onClick} className="button">
      {props.children}
    </div>
  )
}

export default Button;