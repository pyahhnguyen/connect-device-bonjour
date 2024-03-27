const Koa = require('koa');
const http = require('http');
const IO = require('koa-socket-2');

const config = require('./config');
const Device = require('./components/device');

const app = new Koa();
const io = new IO();

const NAME = process.env.DEVNAME || config.name;
const PORT = process.env.PORT || config.port;
app.use(ctx => {
    ctx.body = `Hello, this is device ${NAME}`;
});

io.attach(app);

io.on('message', (ctx, data) => {
    console.log('client sent data to message endpoint', data);
});

const server = http.createServer(app.callback());
server.listen(PORT);
server.on('listening', () => {
    const type = 'http';
    const device = new Device(NAME, type, PORT);
    device.init();

    console.info('Server is listening on port:%d', server.address().port);
});
