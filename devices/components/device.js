const Koa = require('koa');
const http = require('http');
const bonjour = require('bonjour')();
const IO = require('koa-socket-2');

const app = new Koa();
const io = new IO();

const NAME = process.env.DEVNAME || 'noname';
app.use(ctx => {
    ctx.body = `Hello, this is device ${NAME}`;
});

io.attach(app);

io.on('message', (ctx, data) => {
    console.log('client sent data to message endpoint', data);
});



const server = http.createServer(app.callback());
server.listen(process.env.PORT || 3000);
server.on('listening', () => {
    // advertise a service
    const service = bonjour.publish({
        name: NAME,
        type: 'http',
        port: server.address().port 
    });
    service.on('up', () => {
        console.log(`device ${NAME} is up...`);
    });
    service.on('error', err => {
        console.log(`device ${NAME} publish with error...`, err);
    });
    console.info('Server is listening on port:%d', server.address().port);
});
