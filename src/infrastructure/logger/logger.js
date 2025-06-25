import fs from 'fs';
import path from 'path';

import morgan from 'morgan';
import * as rfs from 'rotating-file-stream';

import Config from '../../config/Config.js';

const __dirname = path.resolve();
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logStream = rfs.createStream(`${Config.getInstance().app.name}.log`, {
  interval: '1d',
  path: logDirectory,
  size: '10M',
  compress: 'gzip'
});

const loggerFormat =
  ':remote-addr - :remote-user [:date[web]] ":method :url HTTP/:http-version" [:status] :res[content-length] :response-time ms';

const logger = morgan(loggerFormat, {
  stream: logStream,
  skip: (_, res) =>
    Config.getInstance().service.env === 'production' && res.statusCode < 400
});

export default logger;
