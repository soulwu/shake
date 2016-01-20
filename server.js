import express from 'express';
import http from 'http';
import IO from 'socket.io';

const app = express();
const server = http.Server(app);
const io = IO(server);

app.use(express.static('dist'));

const online = {};
let shaking = {};
let started = false;

const emitSync = (socket, params) => {
  socket.emit('sync', Object.assign({
    online: Object.keys(online).length,
    started,
    shaking
  }, params));
};

const monitor = io.of('/monitor').on('connection', (socket) => {
  emitSync(socket);
  socket.on('start', () => {
    started = true;
    client.emit('started');
    emitSync(monitor);
  });
  socket.on('stop', () => {
    started = false;
    client.emit('stoped');
    emitSync(monitor);
  });
  socket.on('reset', () => {
    started = false;
    shaking = {};
    emitSync(monitor);
  });
});

const client = io.of('/client').on('connection', (socket) => {
  let name;
  socket.on('join', (message) => {
    name = message.name;
    if (!name || !/^[a-zA-Z0-9_u4e00-u9fa5]+$/.test(name)) {
      socket.emit('errored', {error: '昵称不合法'});
    } else if (name in online) {
      socket.emit('errored', {error: '昵称已存在'});
    } else {
      online[name] = true;
      socket.emit('joined', {name});
      emitSync(monitor);
    }
  });
  socket.on('disconnect', () => {
    delete online[name];
    emitSync(monitor);
  });
  socket.on('shaked', () => {
    if (started) {
      if (!(name in shaking)) {
        shaking[name] = 0;
      }
      shaking[name]++;
      emitSync(monitor);
    }
  });
});

server.listen(process.env.PORT || 3000);
