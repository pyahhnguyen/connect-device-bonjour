/**
 * This is misc device like a phone or a fridge.
 */

const Bonjour = require('bonjour');

const config = require('./config');

// set up bonjour instance
const opts = config.bonjour || {};
const bonjour = Bonjour(opts);

const DEVICE_INIT = 0;
const DEVICE_ON = 1;
const DEVICE_OFF = 2;
class Device {
    constructor(name, type) {
        this.name = name;
        this.type = type || 'http';
        this.state = DEVICE_INIT;
        this.client = null;
    }

    init() {
        // init a bonjour client to search devices up/down
        console.log(`Device ${this.name} is on, finding near panel ...`);
        this.client = bonjour.find({ type: this.type });
        this.client.on('up', payload => {
            console.log('up payload>>', payload);
            console.log('Found panel up', { name: payload.name, type: payload.type });
        });
        this.client.on('down', payload => {
            console.log('down payload>>', payload);
            console.log('Found panel down', {
                name: payload.name,
                type: payload.type
            });
        });
    }
}

const device = new Device(process.env.DEVNAME || config.name);
device.init();
