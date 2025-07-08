import Config from '../../config/Config.js';

const config = Config.getInstance();

// const URL_WHITELIST = ['https://rsc-evt.test', 'http://localhost:8180']
const URL_WHITELIST = [];

if (Config.getInstance().service.env === 'development') {
  URL_WHITELIST.push(
    `${config.client.protocol}://${config.client.host}:${config.client.port}`
  );
}

export default URL_WHITELIST;
