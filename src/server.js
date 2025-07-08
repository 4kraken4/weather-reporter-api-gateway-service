/* eslint-disable no-console */
import { createServer } from 'http';

import { Server } from 'socket.io';

import app from './app.js';
import Config from './config/Config.js';
import UrlUtils from './utils/UrlUtils.js';

const config = Config.getInstance();

const server = createServer(app);

const connectedClients = [];

const io = new Server(server, {
  cors: {
    origin: UrlUtils.buildServiceBaseUrl(config.client, false),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  connectedClients.push(socket.id);
  io.to(socket.id).emit('connected', {
    id: socket.id,
    clients: connectedClients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('notification', data => {
    const { targetClientId, message } = data;
    io.to(targetClientId).emit('notification', {
      from: socket.id,
      message
    });
  });

  socket.on('broadcast', data => {
    const { message } = data;
    io.emit('broadcast', {
      from: socket.id,
      message
    });
  });
});

// For local development only
if (process.env.NODE_ENV !== 'production') {
  server.listen(config.service.port, () => {
    // Build URLs using UrlUtils for consistency
    const serverUrl = UrlUtils.buildServiceBaseUrl(config.service, false);
    const clientUrl = UrlUtils.buildServiceBaseUrl(config.client, false);
    const healthUrl = UrlUtils.buildEndpointUrl(
      serverUrl,
      `/${config.app.healthUrl}`
    );
    const swaggerUrl = UrlUtils.buildEndpointUrl(
      serverUrl,
      `/${config.app.swaggerUrl}`
    );
    const websocketUrl = `ws://${config.service.host}:${config.service.port}`;

    console.log(`Server is running at ${serverUrl}`);
    console.log(`Client is running at ${clientUrl}`);
    console.log(`Server health check: ${healthUrl}`);
    console.log(`Web socket is running at ${websocketUrl}`);
    console.log(`Swagger is running at ${swaggerUrl}`);
  });
}

export default server;
