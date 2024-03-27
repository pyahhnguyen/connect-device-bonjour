const Koa = require('koa');
const http = require('http');
const IO = require('koa-socket-2');

const config = require('./config');
const Hub = require('./hub');

const app = new Koa();
const io = new IO();

const NAME = process.env.DEVNAME || config.name;
const PORT = process.env.PORT || config.port;
app.use(ctx => {
    ctx.body = `Hello, this is device ${NAME}`;
});

// wechat server
io.attach(app);

io.on('message', (ctx, data) => {
    console.log('client sent data to message endpoint', data);
});

const server = http.createServer(app.callback());
server.listen(PORT);
server.on('listening', () => {
    const type = 'http';
    const hub = new Hub(NAME, type, PORT);
    hub.init();

    console.info('Server is listening on port:%d', server.address().port);
});
