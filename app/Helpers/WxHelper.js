/**
 * 微信助手
 *
 * @author : Sunkey
 */

const requestPromise = require('request-promise');
const crypto = require('crypto');
const wxApi = require(GLB.CONS.CONFIG_PATH + '/wxApi');

class WxHelper {
	/**
	 * 构造函数
	 * @param  String appId     应用id
	 * @param  String appSecret 应用secret
	 * @param  String scope     授权范围
	 * @return null
	 */
	constructor(appId, appSecret, scope='snsapi_base') {
		// 提前过期时间
		this.AHEAD_EXPIRE_TIME = 600;
		this.TICKET_JS_API = 'jsapi';
		this.TICKET_CARD = 'wx_card';
		this.appId = appId.trim();
		this.appSecret = appSecret.trim();
		this.scope = scope.trim();	
	}

	/**
	 * 获取jsApi签名
	 * @param  String url       页面地址
	 * @param  Number timestamp 时间戳
	 * @param  String nonceStr  随机字符串
	 * @return Promise
	 */
	*getJsApiSignature(pageUrl, timestamp, nonceStr) {
		let jsTicket = yield co(this.getGlobalJsTicket.bind(this), this.TICKET_JS_API);
		if (!jsTicket) {
			return false;
		}

		let params = {
			'jsapi_ticket': jsTicket,
			'noncestr': nonceStr,
			'timestamp': timestamp,
			'url': pageUrl,
		};

        let srcArr = [];
		_.forEach(_.sortBy(_.keys(params)), function(key) {
			srcArr.push(key + '=' + params[key]);
		});

        let srcStr = srcArr.join('&');

		let sha1 = crypto.createHash('sha1');
		sha1.update(srcStr);
		let signature = sha1.digest('hex');

		return signature;
	}

	/**
	 * 获取全局jsTicket
	 * @param  String  ticketType ticket类型
	 * @param  Boolean replay     是否是重试
	 * @return Promise
	 */
	*getGlobalJsTicket(ticketType='jsapi', replay=false) {
		let cacheKey = 'js_ticket_' + ticketType + '_' + this.appId;
		let jsTicket = '';
		try {
			jsTicket = yield GLB.app.cache.get(cacheKey);
		} catch (err) {
		}

		if (!!jsTicket) {
			return jsTicket;
		}

		try {
			var accessToken = yield co(this.getGlobalAccessToken.bind(this), replay);
		} catch (err) {
			return false;
		}

		if (!accessToken) {
			return false;
		}

		let requestOptions = {
			url: wxApi['cgi-bin']['jsticket'],
			qs: {
				'access_token': accessToken,
				'type': ticketType,
			},
			json: true,
		};

		try {
			var resData = requestPromise(requestOptions);
		} catch (err) {
			GLB.app.logger.error(err);
			throw err;
		}

		if (!resData) {
			return false;
		}

		if (!!resData.errcode) {
			// access_token失效
			if (resData.errcode == 40001 && !replay) {
				jsTicket = yield co(this.getGlobalJsTicket.bind(this), this.TICKET_JS_API, true);
				return jsTicket;
			} else {
				GLB.app.logger.error('js_ticket获取失败|' + JSON.stringify(resData));
				return false;
			}
		}

		jsTicket = resData.ticket;

		try {
			yield GLB.app.cache.set(cacheKey, jsTicket, +resData.expires_in - this.AHEAD_EXPIRE_TIME);
		} catch (err) {
			GLB.app.logger.error(err);
		}

		return jsTicket;
	}

	/**
	 * 获取全局accessToken
	 * @param  Boolean refresh 是否是刷新
	 * @return Promise
	 */
	*getGlobalAccessToken(refresh=false) {
		const cacheKey = 'access_token_' + this.appId;
		let accessToken = '';

		if (!!refresh) {
			GLB.app.cache.delete(cacheKey);
		} else {
			try {
				accessToken = yield GLB.app.cache.get(cacheKey);
			} catch (err) {
			}

			if (!!accessToken) {
				return accessToken;
			}
		}

		let requestOptions = {
			uri: wxApi['cgi-bin']['access_token'],
			qs: {
				'grant_type': 'client_credential',
				'appid': this.appId,
				'secret': this.appSecret,
			},
			json: true,
		};

		try {
			var resData = yield requestPromise(requestOptions);
		} catch (err) {
			throw err;
		}

		if (!resData || resData.errcode) {
			GLB.app.logger.error('access_token获取失败|' + JSON.stringify(resData));
			return false;
		}
		accessToken = resData.access_token;

		try {
			yield GLB.app.cache.set(cacheKey, accessToken, +resData.expires_in - this.AHEAD_EXPIRE_TIME);
		} catch (err) {
			GLB.app.logger.error(err);
		}

		return accessToken;
	}

	*clearCache() {
		const jsTicketCacheKey = 'js_ticket_jsapi_' + this.appId;
		const accessTokenCacheKey = 'access_token_' + this.appId;

		const cacheKeys = [
			jsTicketCacheKey,
			accessTokenCacheKey,
		]

		_.forEach(cacheKeys, (cacheKey) => GLB.app.cache.delete(cacheKey));

		return cacheKeys;
	}
}

module.exports = WxHelper;
