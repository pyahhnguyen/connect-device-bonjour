/*
 * @Description: device daemon

 */

const Device = require('./device');
const config = require('./config');
const logger = require('../utils/logger')('DEVICE');

const deviceName = process.env.DEVNAME || config.name;

// for a simple validation here
if (!deviceName.startsWith(config.servicePrefix)) {
    logger.warn('invalid device name');
    process.exit(1);
}
const device = new Device(deviceName);
device.init();
