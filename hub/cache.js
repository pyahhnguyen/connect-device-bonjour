/*
 * @Description: cacher based on ioredis
 * 1. save connect session(socketId, devName)
 * 2. save presence

 */
const _ = require('lodash');
const Redis = require('ioredis');
Redis.Promise = require('bluebird');

const config = require('./config');
const logger = require('../utils/logger')('CACHE');

const opt = _.defaultsDeep(config.redis, {
    host: '127.0.0.1',
    port: '6379',
    db: '12'
});

const key = config.presenceKey;
class Cacher {
    constructor() {
        this.client = new Redis(opt);
    }
    /**
     * @description: fresh presence in redis
     * @param {string} devName
     * @param {string} state  ON|OFF
     * @return: true|false
     */
    async freshPresence(payload) {
        const { devName, state } = payload;

        // update presence
        const presenceStr = await this.client.get(key);
        if (!presenceStr) {
            const presence = { [devName]: state };
            await this.client.set(key, JSON.stringify(presence));
            logger.info('Save presence to redis ok', { presence });
            return true;
        }

        const presence = JSON.parse(presenceStr);
        presence[devName] = state;
        await this.client.set(key, JSON.stringify(presence));
        logger.info('Update presence to redis ok', { presence });
        return true;
    }

    /**
     * @description: save connect session and presence
     * @return:
     */
    async setPresence(payload) {
        const { socketId, devName, state } = payload;

        // save connect session
        await this.client.set(socketId, devName);
        // save presence
        return this.freshPresence({ devName, state });
    }
    /**
     * @description: clear connect session and fresh presence
     * @param {string} socketId
     * @return:
     */
    async clearConnection(payload) {
        const { socketId } = payload;

        // save the socketId, devName key/value
        const devName = await this.client.get(socketId);
        await this.client.del(socketId);

        return this.freshPresence({ devName, state: 'OFF' });
    }

    /**
     * @description: get current presence
     * @return:
     */
    async getPresence() {
        const presenceStr = await this.client.get(key);
        if (!presenceStr) return {};
        return JSON.parse(presenceStr);
    }
}

module.exports = new Cacher();
