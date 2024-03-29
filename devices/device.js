/*
 * @Description: Device class
 * 1. Devices will find hub in the local network with mdns
 * 2. connect the hub with socket.io
 
 */
const net = require('net');
// const mdns = require('mdns');
const io = require('socket.io-client');
const bonjour = require('bonjour')();

const config = require('./config');
const logger = require('../utils/logger')('DEVICE');
class Device {
    constructor(name, type = 'http') {
        this.name = name;
        this.type = type;
        this.client = null;
        this.panel = {}; // suppose 1 only panel in the network for now!!!
    }
    /**
     * @description: create mdns browser to search panel
     * @param {type}
     * @return:
     */
    createBrowser() {
        const browser = bonjour.find({ type: this.type });

        // service up event handler
        browser.on('up', service => {
            logger.debug('service up:', service);
            // filter specific services
            if (!service.name || !service.name.startsWith(config.servicePrefix))
                return false;
            const host = service.addresses.find(ip => net.isIPv4(ip));
            const port = service.port;
            if (!host || !port) return false;
            this.panel = { name: service.name, host, port };
            logger.info('Found a valid panel up', { name: service.name, host, port });
            this.initConnection();
        });

        // service down event handler
        browser.on('down', service => {
            logger.debug('service down:', service);
            if (!service.name || !service.name.startsWith(config.servicePrefix))
                return false;
            logger.warn('Found a panel down', { name: service.name });

            // if down service is panel connected
            if (this.panel.name && this.panel.name === service.name) {
                this.panel = {};
            }
            logger.info('Wait for panel up to connnect ...');
        });

        browser.start();
    }
    /**
     * @description:init socket client
     * @param {type}
     * @return:
     */
    initConnection() {
        const { host, port } = this.panel;
        if (!host || !port) {
            logger.warn('No valid host or port, waiting for panel on...');
            return false;
        }
        logger.info(`Device ${this.name} start to connect panel ...`, {
            host,
            port
        });
        const ioUrl = `http://${host}:${port}/${config.namespace}`;
        logger.debug('panel websocket url', ioUrl);

        this.client = io(ioUrl);
        this.client.on('connect', () => {
            logger.info('Connected panel OK ...');
            // emit online to panel
            this.client.emit('online', { name: this.name });
        });
        // TODO
        this.client.on('disconnect', () => { });
    }

    init() {
        // init socket io connection
        logger.info(`Device ${this.name} is on, components initing ...`);

        logger.info(`mDNS browser init start ...`);
        this.createBrowser();
        logger.info(`mDNS browser init DONE.`);

        logger.info(`socket.io client init start ...`);
        this.initConnection();
        logger.info(`socket.io client init DONE`);
    }
}

module.exports = Device;