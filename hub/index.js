/*
 * @Description: hub daemon
 * 1. A http server with websocket
 * 2. mdns client to find services in the network
 * 3. serve device monitor page
 * @Author: Dennis
 * @LastEditTime: 2019-03-18 12:56:17
 * @LastEditTime: 2019-03-19 20:44:22
 */

const fs = require('fs');
const Koa = require('koa');
const http = require('http');
const path = require('path');
// const mdns = require('mdns');
const bonjour = require('bonjour')();
const socket = require('socket.io');

const config = require('./config');
const cache = require('./cache');
const logger = require('../utils/logger')('PANEL');

const app = new Koa();

const hubName = process.env.DEVNAME || config.name;
const port = process.env.PORT || config.port;

// valid hubName and port
if (!hubName.startsWith(config.namePrefix) || !port) {
  logger.warn('invalid hub name or port');
  process.exit(1);
}

// serve device monitor page
app.use(ctx => {
  ctx.type = 'text/html';
  ctx.body = fs.createReadStream(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app.callback());
const io = socket(server);

// device namespace for device on/off
// chat namespace for sending presence to frontend
const device = io.of(config.namespace.device);
const chat = io.of(config.namespace.chat);

const reportPresence = async () => {
  const presence = await cache.getPresence();
  chat.emit('presence', presence);
};

// device on/off handler
device.on('connection', async socket => {
  logger.info('A device connected');
  socket.on('online', async message => {
    logger.debug('Receive message from device', message);

    // valid name, save the presence to redis
    message.name &&
      (await cache.setPresence({
        socketId: socket.id,
        devName: message.name,
        state: 'ON'
      }));

    // once update, emit presence to devcie monitor
    reportPresence();
  });
  socket.on('disconnect', async msg => {
    logger.warn('device disconnected');
    // delete connection session(socketId, devName)
    await cache.clearConnection({ socketId: socket.id });
    // once update, emit presence to devcie monitor
    reportPresence();
  });
});

// device monitor connect, emit the presence
chat.on('connection', async socket => {
  logger.debug('A device monitor connected');
  reportPresence();
});

server.listen(port);

let service = null;
const doExit = () => {
  logger.warn('service stop ...');
  service.stop(() => {
    logger.warn('service stop done');
    logger.warn('panel leave ...');
    process.exit(1);
  });
};
process.on('SIGINT', err => {
  doExit();
});
process.on('uncaughtException', err => {
  doExit();
});

server.on('listening', () => {
  // mdns deprecated for now
  // publish an advertisement
  // const ad = mdns.createAdvertisement(mdns.tcp('http'), server.address().port, {
  //   name: hubName
  // });
  // ad.start();

  // bonjour
  service = bonjour.publish({
    name: hubName,
    type: 'http',
    port: server.address().port
  });
  service.start();

  logger.info('Server is listening on port:%d', server.address().port);
});
