const express = require('express');
const http = require('http');
const io = require('socket.io');
const winston = require('winston');
const moment = require('moment');
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'extchatdb',
  },
  acquireConnectionTimeout: 60000,
});

const port = process.env.PORT || 3000;
const app = express();
const server = http.Server(app);
const env = process.env.NODE_ENV !== 'production' ? 'development' : 'production';
const logLevel = process.env.LOG_LEVEL || (env === 'development' ? 'debug' : 'info');
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'combined.log',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

server.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
const socketIO = io.listen(server);

if (env === 'production') {
  app.use(express.static(`build/${env}/ChatApp`));
} else {
  app.use(express.static(`build/${env}/ChatApp`));
  app.use(express.static('ChatApp'));
  app.use(express.static('ext'));
}

knex.select(knex.raw('1+1 AS result'))
  .then(() => {
    logger.info('MySQL connection established');
  })
  .catch((err) => {
    logger.error(`Error on connecting mysql database: ${err.stack}`);
  });

let clientsCount = 0;

socketIO.on('connection', (socket) => {
  let user;

  logger.info('Client connected');
  logger.debug(`Client with ID=${socket.client.id} connected from ADDRESS=${socket.handshake.address} on TIME=${socket.handshake.time}`);

  socket.on('login', (data) => {
    if (user) return;

    logger.info('Client loggged in');
    logger.debug(`USER=${JSON.encode(user)} with DATA=${JSON.encode(data)}`);

    clientsCount += 1;

    user = {
      username: data.username,
    };

    const getLostMessages = () =>
      knex.select([
        'username',
        'post_date',
        'text',
      ])
        .from('messages')
        .join('users', 'user_id', 'users.id')
        .where('post_date', '>', user.was_online)
        .orderBy('post_date')
        .map(message => ({
          post_date: moment(message.post_date),
          username: message.username,
          message: message.text.toString(),
        }))
        .then((messages) => {
          socket.emit('user_logged_in', {
            username: user.username,
            online: clientsCount,
            messages,
          });
          socketIO.broadcast.emit('user_logged_in', {
            username: user.username,
            online: clientsCount,
          });
        });

    const onUserInsert = (id) => {
      if (!user.id) {
        user.id = id;
      }

      return getLostMessages();
    };

    knex.select([
      'id',
      'was_online',
    ])
      .from('users')
      .where('username', data.username)
      .limit(1)
      .first()
      .then((dbUser) => {
        if (!dbUser) {
          user.was_online = moment();
          return knex('users')
            .insert({
              username: data.username,
              was_online: user.was_online,
            })
            .returning('id')
            .then(id => onUserInsert(id));
        }

        user.id = dbUser.id;
        user.was_online = dbUser.was_online;
        return knex('users')
          .update({
            was_online: moment(),
          })
          .where('id', dbUser.id)
          .returning('id')
          .then(id => onUserInsert(id));
      });
  });

  socket.on('starttype', () => {
    if (!user) return;

    logger.info('Client typing message');
    logger.debug(`Typing USER=${JSON.encode(user)}`);

    socketIO.emit('user_typing_start', {
      username: user.username,
    });
  });

  socket.on('endtype', () => {
    if (!user) return;

    logger.info('Client ended typing');
    logger.debug(`Ended typing USER=${JSON.encode(user)}`);

    socketIO.emit('user_typing_end', {
      username: user.username,
    });
  });

  socket.on('chat_message', (message) => {
    if (!user) return;

    logger.info('Client sended message');
    logger.debug(`USER=${JSON.encode(user)} sended MESSAGE=${JSON.encode(message)}`);

    const postDate = moment();

    knex('messages')
      .insert({
        user_id: user.id,
        post_date: postDate,
        message,
      })
      .then(() => {
        socketIO.emit('new_message', {
          username: user.username,
          message,
          post_date: postDate,
        });
      });
  });

  const logoutFn = event => () => {
    if (!user) return;

    logger.info('Client logged out');
    logger.debug(`USER=${JSON.encode(user)}`);

    clientsCount -= 1;

    knex('users')
      .update({
        was_online: moment(),
      })
      .where('id', user.id)
      .then(() => {
        socketIO.emit(event, {
          username: user.username,
          online: clientsCount,
        });
        user = null;
      });
  };

  socket.on('logout', logoutFn('user_logged_out'));
  socket.on('close', logoutFn('connection_close'));
  socket.on('disconnect', logoutFn('user_disconnected'));
});
