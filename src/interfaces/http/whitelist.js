import Config from '../../config/Config.js';
import UrlUtils from '../../utils/UrlUtils.js';

const config = Config.getInstance();

const URL_WHITELIST = [UrlUtils.buildServiceBaseUrl(config.client, false)];

export default URL_WHITELIST;
