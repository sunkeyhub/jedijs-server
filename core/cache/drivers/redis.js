/**
 * redis 驱动
 *
 * @author : Sunkey
 */

const redis = require('redis');

class Redis {
    constructor(redisConfig) {
        redisConfig = _.pickBy(redisConfig, (val) => {return val;});

        this.client = redis.createClient(redisConfig);

        this.client.on('error', (err) => {
            GLB.app.logger.error(err);
        });

        this.client.on('ready', (err) => {
            GLB.app.logger.info('redis is ready.');
        });
    }

    set(key, val, expire) {
        return new Promise((resolve, reject) => {
            this.client.set(key, val, (err, data) => {
                if (err) {
                    reject(err);
                } 
                this.client.expire(key, expire);
                resolve(data);
            });
        });
    }

    get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }

    delete(key) {
        return this.client.expire(key, 0);
    }
}

module.exports = Redis;
