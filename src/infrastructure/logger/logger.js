import fs from 'fs';
import path from 'path';
import { stdout } from 'process';

import morgan from 'morgan';
import * as rfs from 'rotating-file-stream';

import Config from '../../config/Config.js';

// Create a custom date token for Sri Lankan time
morgan.token('date-lk', () => {
  return new Date()
    .toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
      timeZoneName: 'short'
    })
    .replace(/,/g, '')
    .replace(/\//g, '-')
    .replace(/\s+/g, ' ')
    .trim();
});

const config = Config.getInstance();
const isProduction = config.service.env === 'production';

// Initialize logger stream
const initializeLogger = () => {
  if (isProduction) {
    // Use stdout in production (Vercel-friendly)
    return stdout;
  }

  // Use file stream in non-production environments
  const __dirname = path.resolve();
  const logDirectory = path.join(__dirname, 'logs');

  // Create logs directory synchronously
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(logDirectory)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(logDirectory, { recursive: true });
  }

  return rfs.createStream(`${config.app.name}.log`, {
    interval: '1d',
    path: logDirectory,
    size: '10M',
    compress: 'gzip'
  });
};

const logStream = initializeLogger();

const loggerFormat =
  ':remote-addr - :remote-user [:date-lk] [:method] ":url HTTP/:http-version" [:status] :res[content-length] :response-time ms';

const logger = morgan(loggerFormat, {
  stream: logStream,
  skip: (_, res) => isProduction && res.statusCode < 400
});

export default logger;
