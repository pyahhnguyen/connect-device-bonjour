module.exports = {
  name: 'PRM#Panel',
  port: 3000,
  presenceKey: 'presence',
  namePrefix: 'PRM#',
  namespace: {
    device: 'device',
    chat: 'chat'
  },
  redis: {
    host: process.env.REDIS_URL || '127.0.0.1',
    port: '6379',
    db: '12'
  }
};
