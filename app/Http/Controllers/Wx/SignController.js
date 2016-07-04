/**
 * 微信签名控制器
 *
 * @author : Sunkey
 */

const BaseController = require(GLB.CONS.CONTROLLER_PATH + '/Wx/BaseController');
const wxCenter = require(GLB.CONS.DATA_PATH + '/wxCenter');
const WxHelper = require(GLB.CONS.HELPER_PATH + '/WxHelper');
const StringHelper = require(GLB.CONS.HELPER_PATH + '/StringHelper');

class SignController extends BaseController {
    before() {
        try {
            if (!this.checkWxNum()) {
                return this.response.json({code: 400, msg: 'wx_num not exists!'});
            }
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * 获取jsApi签名接口
     * 
     * @return Json
     */
    *jsApi() {
        const pageMatch = /\?page_url=([^#]*)#?/.exec(this.request.originalUrl);
	    const pageUrl = pageMatch && pageMatch.length > 1 && pageMatch[1];
        if (!pageUrl) {
            return this.response.json({code: 400, msg: '缺少page_url参数'});
        } else if (!/^http(s)?:\/\/.+/.test(pageUrl)) {
            return this.response.json({code: 400, msg: 'page_url参数非法，必须是有效的url.'});
        }

        const wxHelper = new WxHelper(wxCenter[this.wxNum].APP_ID, wxCenter[this.wxNum].APP_SECRET);
        const timestamp = _.floor(_.now()/1000);
        const nonceStr = StringHelper.random(6);

        try {
            var signature = yield co(wxHelper.getJsApiSignature.bind(wxHelper), pageUrl, timestamp, nonceStr);
        } catch (err) {
            throw err;
        }

        if (!signature) {
            return this.response.json({code: 500, msg: 'sign error'});
        }

        const jsApiConfig = {
            'appId': wxCenter[this.wxNum].APP_ID,
            'timestamp': timestamp,
            'nonceStr': nonceStr,
            'signature': signature,
        };

        return this.response.json({code: 200, data: jsApiConfig});
    }
}

module.exports = SignController;
