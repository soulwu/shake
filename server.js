import express from 'express';
import http from 'http';
import IO from 'socket.io';
import nwo from 'node-weixin-oauth';

const app = express();
const server = http.Server(app);
const io = IO(server);

app.use(express.static('dist'));

app.get('/client', (req, res) => {
  const code = req.params.code;
  if (!code) {
    res.redirect(nwo.createURL('wx56c006e34bb90b4c', 'http://s.dmatou.com/client', '', 1));
    return;
  }

  nwo.success({id: 'wx56c006e34bb90b4c', secret: 'bb0a1e600fba93e0d10f15ab6410944b'}, code, (error, body) => {
    if (!error) {
      nwo.profile(body.openid, body.access_token, (error, body) => {
        console.log(body);
        res.sendFile(`${__dirname}/dist/client.html`);
      });
    }
  })
});

const online = [];
const scores = [];
let started = false;

const emitSync = (socket, params) => {
  socket.emit('sync', Object.assign({
    online: online.length,
    started,
    scores
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
    scores.splice(0, scores.length);
    emitSync(monitor);
  });
});

const client = io.of('/client').on('connection', (socket) => {
  let name;
  socket.on('join', (message) => {
    name = message.name;
    if (!name || !/^\S+$/.test(name)) {
      socket.emit('errored', {error: '昵称不合法'});
    } else if (online.indexOf(name) !== -1) {
      socket.emit('errored', {error: '昵称已存在'});
    } else {
      online.push(name);
      socket.emit('joined', {name});
      emitSync(monitor);
    }
  });
  socket.on('disconnect', () => {
    const index = online.indexOf(name);
    online.splice(index, 1);
    emitSync(monitor);
  });
  socket.on('shaked', () => {
    if (started) {
      let score;
      for (let s of scores) {
        if (s.name === name) {
          score = s;
          break;
        }
      }
      if (!score) {
        score = {
          name,
          count: 0
        };
        scores.push(score);
      }
      score.count++;
      emitSync(monitor);
      socket.emit('shaked', score);
    }
  });
});

server.listen(process.env.PORT || 3000);
