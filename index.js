#!/usr/bin/env node
const yargs = require('yargs');
const sgui = require('./sgui.js');

yargs.command({
    command: "run [jsonfile]",
    desc: "Launch swagger-ui webpage with [swagger json file] ",
    builder: (yargs) => {
        yargs.option('p', {
            alias: 'port',
            describe: `服务器端口，默认3000`
        });
        yargs.option('t', {
            alias: 'title',
            describe: '页面标题文本'
        });
        yargs.option('o', {
            alias: 'autoOpen',
            describe: `添加该参数，表示自动打开Chrome浏览器`
        })
        yargs.option('wf', {
            alias: 'watchfile',
            describe: '监控的文件路径，该文件变化会执行页面实时刷新'
        });
        yargs.option('wp', {
            alias: 'watchport',
            describe: `监控服务器端口，默认2500`
        });
    },
    handler: (argv) => {
        sgui.launch(argv);
    }
}).version().help().alias({
    "h": "help",
    "v": "version"
}).strict(true).demandCommand().argv;