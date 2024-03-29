const fs = require('fs');
const Koa = require('koa');
const mdns = require('mdns');
const http = require('http');
const path = require('path');
const socket = require('socket.io');

const config = require('./config');
const cache = require('./cache');

const app = new Koa();

const NAME = process.env.DEVNAME || config.name;
const PORT = process.env.PORT || config.port;
// app.use(ctx => {
//   ctx.body = `Hello, this is device ${NAME}`;
// });
app.use(ctx => {
    ctx.type = 'text/html';
    ctx.body = fs.createReadStream(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app.callback());
const io = socket(server);
// news for device on/off  chat for sending presence to frontend
const device = io.of('device');
const chat = io.of('chat');
device.on('connection', async socket => {
    console.log('A device connected');
    socket.on('message', async message => {
        console.log('Receive message from device', message);
        message.name &&
            (await cache.setPresence({
                socketId: socket.id,
                devName: message.name,
                state: 'ON'
            }));
        const presence = await cache.getPresence();
        chat.emit('presence', presence);
    });
    socket.on('disconnect', async msg => {
        console.log('device disconnected');
        await cache.clearConnection({ socketId: socket.id });
        const presence = await cache.getPresence();
        chat.emit('presence', presence);
    });
});

chat.on('connection', async socket => {
    console.log('A device monitor connected');
    const presence = await cache.getPresence();
    chat.emit('presence', presence);
});
server.listen(PORT);
server.on('listening', () => {
    const type = 'http';

    // publish an advertisement
    const opt = { name: NAME };
    const ad = mdns.createAdvertisement(
        mdns.tcp('http'),
        server.address().port,
        opt
    );
    ad.start();

    console.info('Server is listening on port:%d', server.address().port);
});
