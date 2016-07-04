/**
 * 欢迎控制器
 *
 * @author : Sunkey
 */

var Controller = require(GLB.CONS.COMPONENT_PATH + '/Controller');
const requestPromise = require('request-promise');
const EventEmitter = require('events');

class IndexController extends Controller {
    /**
     * 入口
     * 
     * @return Json
     */
    *index() {
            const request = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('finish-' + Date.now());
                }, 5000);
            });
            try {
                var rt = yield request;
            } catch (err) {
                console.log(err);
            }

            return this.response.json(rt);
    }

    *waiting() {
        setTimeout(() => {
            return this.response.end('finish' + Date.now());
        }, 3000);
    }
}

module.exports = IndexController;
