/**
 * Usage:
 *  jim your_jim_string
 *
 */
var JIM = require('./jim'),
  fs = require('fs');


var METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
var Router = {};

METHODS.forEach(function(method) { Router[method] = []; });

var RE = {
  gMethods: new RegExp('^(' + METHODS.join('|') + ')\\s+(.*?)\\s*$', 'gm')
};


function load(file) {
  file = require('path').resolve(process.cwd(), file);
  if (!fs.existsSync(file)) {
    console.error('File ' + file + ' is not exists.');
    return false;
  }

  var stat = fs.statSync(file);
  if (stat.isDirectory()) {
    fs.readdirSync(file).forEach(load);
  } else if (!stat.isFile() || !(/\.jim$/.test(file))) {
    return false;
  }

  var content = fs.readFileSync(file), contentLength;
  content = JIM.loadTypesFromContent(content.toString()),
  contentLength = content.length;

  // 分析 router
  var indexes = [];
  content.replace(RE.gMethods, function(raw, method, path, index) {
    indexes.push({raw: raw, method: method, path: path, index: index});
    return raw;
  });

  indexes.forEach(function(item, i, ref) {
    if (item.method in Router) {
      var next = ref[i+1], toIndex = next ? next.index : contentLength;

      var jim = content.substring(item.index + item.raw.length, toIndex).trim();

      Router[item.method].push({path: item.path, jim: jim});
    }
  });
}


function match(method, path) {
  var routers = Router[method.toUpperCase()];
  if (routers && routers.length) {
    for (var i = 0; i < routers.length; ++i) {
      if (routers[i].path === path) {
        return routers[i].jim;
      }
    }
  }
  return false;
}


JIM.Router = {
  load: load,
  match: match
};



module.exports = JIM;





