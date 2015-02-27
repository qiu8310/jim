
var http = require('http');
var JIM = require('./jim-router.js');
var fs = require('fs');
var Router = JIM.Router;

var port = 9911;

var program = require('commander');


program
  .version(require('../package.json').version)
  .option('-p, --port [port]', '指定服务器端口号，默认' + port)
  .option('-d, --debug', '每次刷新页面时重新加载JIM文件')
  .option('-i, --include <jimFiles>', '指定要加载的 JIM 文件', function(s) { return s.split(/[,;\|]/); })
  .parse(process.argv);

if (program.port) {
  port = parseInt(program.port, 10);
}
if (!program.include) {
  console.error('\r\n  Error: no include jim files.');
  program.help();
}

var init = function() {
  program.include.forEach(Router.load);
  if (!program.debug) {
    program.include = [];
  }
};

init();

http.createServer(function(req, res) {

  if (req.url === '/favicon.ico') { res.end(); }

  init();

  var json,
    jimStr = Router.match(req.method, req.url);

  if (!jimStr) {
    res.end('No router');
  } else {
    res.writeHead(200, {'Content-Type': 'application/json'});
    json = JIM.exec(jimStr);
  }

  res.end(JSON.stringify(json));


}).listen(port, '0.0.0.0');

console.log('Server is listening ' + port);