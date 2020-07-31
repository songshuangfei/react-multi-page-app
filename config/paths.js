const path = require("path");

const rootDir = process.cwd();
const appSrc = path.resolve(rootDir, "src");
const pagesRoot = path.resolve(appSrc, "pages");
const publicRoot = path.resolve(rootDir, "public");
const outputPath = path.resolve(rootDir, "dist");
const htmlTemplatePath = path.resolve(rootDir, "config/htmlTemplate");
// dev 
const devOutputPath = path.resolve("/");

module.exports = {
  rootDir,
  appSrc,
  pagesRoot,
  publicRoot,
  outputPath,
  htmlTemplatePath,
  getPageHtmlOutputPath: (pageName) => path.resolve(outputPath, pageName, "index.html"),
  getPageEntryPath: (pageName) => path.resolve(pagesRoot, pageName, "index.js"),
  getPageConfigJsonPath: (pageName) => path.resolve(pagesRoot, pageName, "pageInfo.json"),
  getHtmlTemplatePath: (templateName) => path.resolve(htmlTemplatePath, `${templateName}.html`),
  // dev
  devOutputPath,
  getDevPageHtmlOutputPath:(pageName)=> path.resolve(devOutputPath, pageName, "index.html"),
}