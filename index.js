#!/usr/bin/env node
const express = require('express');
const yargs = require('yargs');
const opn = require('opn');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const defaultTitle="Swagger UI";
const defaultPort=3000;
const defaultWatchPort=2500;
const defaultSwaggerJSON="http://petstore.swagger.io/v2/swagger.json";

//launch server
function launchServer(argv){
  let jsonfile = argv["jsonfile"]||defaultSwaggerJSON;
  let port = argv["port"]||defaultPort;
  let watchPort = argv["watchport"]||defaultWatchPort;
  let title = argv["title"]||defaultTitle;

  let queryStr =`title=${encodeURIComponent(title)}&jsonfile=${encodeURIComponent(jsonfile)}&watchport=${watchPort}`;
  let url = `http://localhost:${port}/static/index.html?${queryStr}`;
 
  let app = express();
  app.use('/static', express.static(path.join(__dirname,'public')));
  app.listen(port, function () {
    console.log(`start to open:${url}`);
    opn(url, {app: ['google chrome', '--incognito']});
  });
}

//launch watcher
function launchWatcher(argv){
  let watchPort =argv["watchport"]||defaultWatchPort;
  let io = require('socket.io')();
  io.listen(watchPort);
  io.on('connection', function(socket){
     socket.on("filechange",(data)=>{
        socket.broadcast.emit("refresh",data);
     });
  });
}

//watch file and hot refresh swagger-ui
function watchFile(argv){
  let watchPort =argv["watchport"]||defaultWatchPort;
  let socket = require('socket.io-client')(`http://localhost:${watchPort}`);
  socket.on('connect', function(){ });
  socket.on('disconnect', function(){ });
  let watcher = chokidar.watch(argv["watchfile"], {
    ignored: /[\/\\]\./, persistent: true
  });
  watcher.on('change', function(path) { 
      console.log(`Time:${new Date().getTime()} ${path}`);
      socket.emit("filechange",path);
  });
}

//build command
yargs.command({
  command:"run [jsonfile]",
  desc:"Launch swagger-ui webpage with [swagger json file] ",
  builder: (yargs) => {
    yargs.option('p', {
        alias: 'port',
        describe: `服务器端口，默认${defaultPort}`
    });
    yargs.option('t', {
      alias: 'title',
      describe: '页面标题文本'
    });
    yargs.option('wf', {
      alias: 'watchfile',
      describe: '监控的文件路径，该文件变化会执行页面实时刷新'
    });
    yargs.option('wp', {
      alias: 'watchport',
      describe: `监控服务器端口，默认${defaultWatchPort}`
    });
  },
  handler:function(argv){
    launchServer(argv);

    let filePath = argv["watchfile"];
    if(!filePath)return;
    if(!fs.existsSync(filePath))return;

    launchWatcher(argv);
    watchFile(argv);
  }
})
.version()
.help()
.alias({
    "h": "help",
    "v": "version"
})
.strict(true)
.demandCommand()
.argv;