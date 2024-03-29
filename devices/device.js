/*
 * @Description: Device class
 * 1. Devices will find hub in the local network with mdns
 * 2. connect the hub with
 

/**
 *
 * This is misc device like a phone or a fridge.
 */
const net = require('net');
const mdns = require('mdns');
const io = require('socket.io-client');

const config = require('./config');
const logger = require('../utils/logger')('DEVICE');

// const DEVICE_INIT = 0;
// const DEVICE_ON = 1;
// const DEVICE_OFF = 2;
class Device {
    constructor(name, type) {
        this.name = name;
        this.type = type || 'http';
        // this.state = DEVICE_INIT;
        this.client = null;
        this.panel = {};
    }

    initClient() {
        // init a bonjour client to search devices up/down
        const browser = mdns.createBrowser(mdns.tcp(this.type));

        browser.on('serviceUp', service => {
            const host = service.addresses.find(ip => net.isIPv4(ip));
            const port = service.port;
            this.panel = { name: service.name, host, port };
            console.log('Found a panel up', { name: service.name, host, port });
            this.initConnection();
        });
        browser.on('serviceDown', service => {
            console.log('Found panel down', {
                name: service.name
            });
            if (this.panel.name && this.panel.name === service.name) {
                this.panel = {};
            }
        });

        browser.start();
    }

    initConnection() {
        console.log(`Device ${this.name} start to connect panel ...`, {
            host: this.panel.host,
            port: this.panel.port
        });
        const ioStr = `http://${this.panel.host}:${this.panel.port}/news`;
        this.client = io(ioStr);
        // this.client = io();
        this.client.on('connect', () => {
            console.log('Connected panel OK ...');
            this.client.emit('message', { name: this.name });
        });
        this.client.on('event', data => {
            console.log('receive data', data);
        });
        this.client.on('disconnect', () => {
            console.log('reconnecting ...');
        });
    }

    init() {
        // init socket io connection
        logger.info(`Device ${this.name} is on, finding near panel ...`);
        this.initConnection();
        // init mdns browser
        this.initClient();
    }
}

const device = new Device(process.env.DEVNAME || config.name);
// device.init();
