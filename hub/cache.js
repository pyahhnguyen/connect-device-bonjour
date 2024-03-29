const Redis = require('ioredis');
Redis.Promise = require('bluebird');

const config = require('./config');

const opt = config.redis || {
    host: '127.0.0.1',
    port: '6379',
    db: '12'
};

const key = 'presence';
class Cacher {
    constructor() {
        this.client = new Redis(opt);
    }

    async freshPresence(payload) {
        const { devName, state } = payload;

        // update presence
        const presenceStr = await this.client.get(key);
        if (!presenceStr) {
            const presence = { [devName]: state };
            await this.client.set(key, JSON.stringify(presence));
            console.log('Save presence to redis ok', { presence });
            return true;
        }

        const presence = JSON.parse(presenceStr);
        presence[devName] = state;
        await this.client.set(key, JSON.stringify(presence));
        console.log('Update presence to redis ok', { presence });
        return true;
    }
    async setPresence(payload) {
        const { socketId, devName, state } = payload;

        // save the socketId, devName key/value
        await this.client.set(socketId, devName);
        return this.freshPresence({ devName, state });
    }

    async clearConnection(payload) {
        const { socketId } = payload;

        // save the socketId, devName key/value
        const devName = await this.client.get(socketId);
        await this.client.del(socketId);

        return this.freshPresence({ devName, state: 'OFF' });
    }

    async getPresence(payload) { }
}

module.exports = new Cacher();
