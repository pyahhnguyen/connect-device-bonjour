/**
 * This component is about bonjour service and client
 */

const Bonjour = require('bonjour');

const config = require('./config');

// set up bonjour instance
const opts = config.bonjour || {};
const bonjour = Bonjour(opts);

class Device {
    constructor(name, type, port) {
        this.name = name;
        this.type = type || 'http';
        this.port = port;
        this.service = null;
        this.client = null;
    }

    init() {
        // advertise a service
        this.service = bonjour.publish({
            name: this.name,
            type: this.type,
            port: this.port
        });
        this.service.on('up', () => {
            console.log(`device ${this.name} is up...`);
        });
        this.service.on('error', err => {
            console.log(`device ${this.name} publish with error...`, err);
        });

        // init a bonjour client to search devices up/down
        this.client = bonjour.find({ type: this.type });
        this.client.on('up', payload => {
            console.log('new device up', { name: payload.name, type: payload.type });
        });
        this.client.on('down', payload => {
            console.log('device down', { name: payload.name, type: payload.type });
        });
    }
}

module.exports = Device;
