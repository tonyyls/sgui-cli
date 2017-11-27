#!/usr/bin/env node
const express = require('express');
const yargs = require('yargs');
const opn = require('opn');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const defaultTitle = "Swagger UI";
const defaultSwaggerJSON = "http://petstore.swagger.io/v2/swagger.json";
const defaultPort = 3000;
const defaultWatchPort = 2500;

let url;
//launch server
function initServer(argv) {
    let jsonfile = argv["jsonfile"] || defaultSwaggerJSON;
    let port = argv["port"] || defaultPort;
    let watchPort = argv["watchport"] || defaultWatchPort;
    let title = argv["title"] || defaultTitle;
    let autoOpen = argv["autoOpen"];

    let queryStr = `title=${encodeURIComponent(title)}&jsonfile=${encodeURIComponent(jsonfile)}&watchport=${watchPort}`;
    url = `http://localhost:${port}/static/index.html?${queryStr}`;

    let app = express();
    app.use('/static', express.static(path.join(__dirname, 'public')));
    app.listen(port, () => {
        if (autoOpen) {
            openBroswer();
        }
    });
}

function openBroswer() {
    let platform = process.platform;
    let appName;
    if (platform === "darwin") {
        appName = "google chrome";
    } else if (platform === "win32") {
        appName = "chrome";
    } else if (platform === "linux") {
        appName = "google-chrome";
    }
    opn(url, {app: [appName]});
}

//launch watcher
function initWatcher(argv) {
    let watchPort = argv["watchport"] || defaultWatchPort;
    let io = require('socket.io')();
    io.listen(watchPort);
    io.on('connection', (socket) => {
        socket.on("filechange", (data) => {
            socket.broadcast.emit("refresh", data);
        });
    });
}

//watch file and hot refresh swagger-ui
function watchFile(argv) {
    let watchPort = argv["watchport"] || defaultWatchPort;
    let socket = require('socket.io-client')(`http://localhost:${watchPort}`);
    let watcher = chokidar.watch(argv["watchfile"], {
        ignored: /[\/\\]\./, persistent: true
    });
    watcher.on('change', (path) => {
        console.log(`Time:${new Date().getTime()} ${path}`);
        socket.emit("filechange", path);
    });
}

var sgui = {
    launch: (argv) => {
        argv = argv || {};
        initServer(argv);
        let filePath = argv["watchfile"];
        if (!filePath)return;
        if (!fs.existsSync(filePath))return;
        initWatcher(argv);
        watchFile(argv);
    },
    open: () => {
        openBroswer();
    }
}
module.exports = sgui;