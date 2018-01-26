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

//launch server
function initServer(argv) {
    //prepare params
    let jsonfile = argv["jsonfile"] || defaultSwaggerJSON;
    let port = argv["port"] || defaultPort;
    let watchPort = argv["watchport"] || defaultWatchPort;
    let title = argv["title"] || defaultTitle;
    let autoOpen = argv["autoOpen"];

    //swagger dist and replace content
    const swaggerUIDir = path.join(__dirname, 'public');
    const html = fs.readFileSync(path.join(__dirname, 'public/index.html'), {encoding: 'utf-8'})
        .replace(defaultSwaggerJSON, jsonfile)
        .replace('<title>Swagger UI</title>', `<title>${title}</title><base href="/">`)
        .replace('2500', watchPort)

    let url = `http://localhost:${port}`;
    const app = express();
    app.use('/', serveSwaggerUi);
    app.use('/', express.static(swaggerUIDir));
    app.listen(port, () => {
        if (autoOpen) {
            openBroswer(url);
        }
    });
    console.log(`\nSuccess started, now you can open the swagger ui at ${url}\n`);

    function serveSwaggerUi(req, res, next) {
        return /^\/?$/.test(req.path) ? res.status(200).send(html) : next();
    }
}

//open url with Chrome
function openBroswer(url) {
    const platform = process.platform;
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
        socket.emit("filechange", path);
    });
}

var sgui = {
    /**
     * launch swagger ui
     * @param argv
     * @param argv.jsonfile  swagger json path
     * @param argv.port server port default 3000
     * @param argv.title  swagger ui title
     * @param argv.autoOpen auto open chrome broswer
     * @param argv.watchfile watch file to refresh swagger ui
     * @param argv.watchport watcher server port default 2500
     */
    launch: (argv) => {
        argv = argv || {};
        initServer(argv);
        let filePath = argv["watchfile"];
        if (!filePath)return;
        if (!fs.existsSync(filePath))return;
        initWatcher(argv);
        watchFile(argv);
    }
}
module.exports = sgui;