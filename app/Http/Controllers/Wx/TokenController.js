/**
 * 微信签名控制器
 *
 * @author : Sunkey
 */

const crypto = require('crypto');
const BaseController = require(GLB.CONS.CONTROLLER_PATH + '/Wx/BaseController');
const wxConfig = require(GLB.CONS.CONFIG_PATH + '/wx');
const wxCenter = require(GLB.CONS.DATA_PATH + '/wxCenter');
const WxHelper = require(GLB.CONS.HELPER_PATH + '/WxHelper');

class TokenController extends BaseController {
    before() {
        if (!this.checkSign()) {
            return this.response.json({code: 400, msg: 'incorrect sign!'})
        }

        if (!this.checkExpire()) {
            return this.response.json({code: 400, msg: 'sign expired!'});
        }

        if (!this.checkWxNum()) {
            return this.response.json({code: 400, msg: 'wx_num not exists!'});
        }
    }

    /**
     * 获取全局 access_token 接口
     */
    *accessToken() {
        let accessToken = '';
        const wxHelper = new WxHelper(wxCenter[this.wxNum].APP_ID, wxCenter[this.wxNum].APP_SECRET); 

        try {
            accessToken = yield co(wxHelper.getGlobalAccessToken.bind(wxHelper));
        } catch (err) {
            GLB.app.logger.error(err);
        }

        if (!accessToken) {
            return this.response.json({code: 500, msg: 'app_id or app_secret invalid！'});
        }

        return this.response.json({code: 200, data: {access_token: accessToken}});
    }

    /**
     * 获取 jsapi_ticket 接口
     */
    *jsapiTicket() {
        let jsTicket = '';
        const wxHelper = new WxHelper(wxCenter[this.wxNum].APP_ID, wxCenter[this.wxNum].APP_SECRET); 

        try {
            jsTicket = yield co(wxHelper.getGlobalJsTicket.bind(wxHelper));
        } catch (err) {
            GLB.app.logger.error(err);
        }

        if (!jsTicket) {
            return this.response.json({code: 500, msg: 'app_id or app_secret invalid！'});
        }

        return this.response.json({code: 200, data: {jsapi_ticket: jsTicket}});       
    }

    /**
     * 清除token缓存接口
     */
    *clearCache() {
        const wxHelper = new WxHelper(wxCenter[this.wxNum].APP_ID, wxCenter[this.wxNum].APP_SECRET);
        const result = yield co(wxHelper.clearCache.bind(wxHelper));

        return this.response.json({code: 200, data: result, msg: '缓存清除成功'});
    }
}

module.exports = TokenController;
