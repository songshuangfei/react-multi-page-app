'use strict';
const fs = require("fs");
const path = require("path");
const paths = require("../config/paths");

const pageName = process.argv[2];
const pagePath = path.resolve(paths.pagesRoot, pageName);
if(fs.existsSync(pagePath)){
  console.error(`error: The page named ${pageName} already exists`);
  process.exit(0)
}

fs.mkdirSync(pagePath);
fs.writeFileSync(path.resolve(pagePath, "index.js"), `
document.getElementById("root").innerHTML = "${pageName}"
`)

fs.writeFileSync(path.resolve(pagePath, "pageInfo.json"), `{
  "title": "${pageName}",
  "description": "",
  "keywords": []
}
`)

console.log(`create page succeed`)