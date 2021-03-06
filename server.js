import express from 'express';
import http from 'http';
import IO from 'socket.io';
import nwo from 'node-weixin-oauth';

const app = express();
const server = http.Server(app);
const io = new IO(server);

app.use(express.static('dist'));
app.set('views', `${__dirname}/dist`);
app.set('view engine', 'ejs');

app.get('/client', (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.redirect(nwo.createURL('wx56c006e34bb90b4c', `${req.protocol}://${req.hostname}/client`, '', 1));
    return;
  }

  nwo.success({id: 'wx56c006e34bb90b4c', secret: '32981a4ced0b006298fcd1ba96189ce4'}, code, (error, body) => {
    if (!error) {
      nwo.profile(body.openid, body.access_token, (error, body) => {
        if (!error) {
          console.log(body);
          res.render('client', {
            openId: body.openid,
            nickname: body.nickname
          });
        }
      });
    }
  });
});

const online = [];
const scores = [];
let started = false;

let monitor = null;

const emitSync = (socket, params) => {
  if (!socket) {
    return;
  }
  socket.emit('sync', Object.assign({
    online: online.length,
    started,
    scores
  }, params));
};

const client = io.of('/client').on('connection', (socket) => {
  let id;
  let name;
  socket.on('join', (message) => {
    id = message.id;
    name = message.name;
    if (!id || !name) {
      socket.emit('errored', {error: '昵称不合法'});
    } else if (online.indexOf(id) !== -1) {
      socket.emit('errored', {error: '昵称已存在'});
    } else {
      online.push(id);
      socket.emit('joined', {
        id,
        name
      });
      emitSync(monitor);
    }
  });
  socket.on('disconnect', () => {
    const index = online.indexOf(id);
    online.splice(index, 1);
    emitSync(monitor);
  });
  socket.on('shaked', () => {
    if (started) {
      let score;
      for (const s of scores) {
        if (s.id === id) {
          score = s;
          break;
        }
      }
      if (!score) {
        score = {
          id,
          name,
          count: 0
        };
        scores.push(score);
      }
      score.count++;
      socket.emit('shaked', score);
    }
  });
});

monitor = io.of('/monitor').on('connection', (socket) => {
  let timer = null;
  emitSync(socket);
  socket.on('start', () => {
    started = true;
    client.emit('started');
    emitSync(monitor);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    timer = setInterval(() => {
      emitSync(monitor);
    }, 1000);
  });
  socket.on('stop', () => {
    started = false;
    client.emit('stoped');
    emitSync(monitor);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });
  socket.on('reset', () => {
    started = false;
    scores.splice(0, scores.length);
    emitSync(monitor);
    clearInterval(timer);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });
});

server.listen(process.env.PORT || 3000);
