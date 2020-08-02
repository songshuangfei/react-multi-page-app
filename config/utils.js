'use strict';

const path = require("path");
const mime = require("mime");

const readJsonSync = (_fs, dir)=> JSON.parse(_fs.readFileSync(dir));

const getFoldersOfPathSync = (_fs, dir) => _fs.readdirSync(dir)
  .filter(name => _fs.statSync(path.resolve(dir, name)).isDirectory());

const isPathExistSync = (_fs, dir) => _fs.existsSync(dir);

const isPathExist = (_fs, dir) => new Promise((rs) => _fs.exists(dir, exist => rs(exist)));

async function isFile(_fs, dir) {
  const exist = await isPathExist(_fs, dir);
  if(!exist) return false;
  return new Promise((rs, rj) => {
    _fs.stat(dir, (err, stat) => err ? rj(err) : rs(stat.isFile()))
  })
}

function readFile(_fs, dir) {
  return new Promise((rs, rj) => {
    _fs.readFile(dir, (err, data) => err ? rj(err) : rs(data))
  })
}

// 获取指定文件系统下的文件内容和文件的mime
async function getFileContentAndMIME(_fs, dir) {
  const data = await readFile(_fs, dir);
  return {
    content: data, 
    type: mime.getType(dir) 
  }
}

function cleanDir(_fs, dir){
  function _clean(pathDir) {
    for (const filename of _fs.readdirSync(pathDir)) {
      const currentPath = path.resolve(pathDir, filename)
      if (_fs.statSync(currentPath).isDirectory())
        _clean(currentPath);
      else
        _fs.unlinkSync(currentPath);
    }
    _fs.rmdirSync(pathDir);
  }
  if(_fs.existsSync(dir))
  _clean(dir);
}


function copyDir(_fs, source, target){
  if(!_fs.existsSync(target))
    _fs.mkdirSync(target);
  for (const filename of _fs.readdirSync(source)) {
    const currentPath = path.resolve(source, filename);
    const targetPath = path.resolve(target, filename);
    if (_fs.statSync(currentPath).isDirectory()){
      copyDir(_fs, currentPath, targetPath);
    }
    else{
      const data = _fs.readFileSync(currentPath);
      _fs.writeFileSync(targetPath, data)
    }
  }
}

module.exports = {
  readJsonSync,
  getFoldersOfPathSync,
  isPathExistSync,
  isPathExist,
  isFile,
  readFile,
  getFileContentAndMIME,
  cleanDir,
  copyDir,
}

