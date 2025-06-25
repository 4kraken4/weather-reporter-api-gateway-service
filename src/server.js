/* eslint-disable no-console */
import { createServer } from 'http';

import { Server } from 'socket.io';

import app from './app.js';
import Config from './config/Config.js';

const config = Config.getInstance();

const server = createServer(app);

const connectedClients = [];

const io = new Server(server, {
  cors: {
    origin: config.client.baseUrl,
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
// eslint-disable-next-line no-undef
if (process.env.NODE_ENV !== 'production') {
  server.listen(config.service.port, () => {
    console.log(
      `Server is running at ${config.service.protocol}://${config.service.host}:${config.service.port}`
    );
    console.log(
      `Client is running at ${config.client.protocol}://${config.client.host}:${config.client.port}`
    );
    console.log(
      `Server health check: ${config.service.protocol}://${config.service.host}:${config.service.port}/${config.service.routePrefix}/${config.app.healthUrl}`
    );
    console.log(
      `Web socket is running at ws://${config.service.host}:${config.service.port}`
    );
    console.log(
      `Swagger is running at ${config.service.protocol}://${config.service.host}:${config.service.port}/${config.service.routePrefix}/${config.app.swaggerUrl}`
    );
  });
}

export default server;
