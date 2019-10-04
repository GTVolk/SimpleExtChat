const express = require('express');
const http = require('http');
const io = require('socket.io');
const winston = require('winston');
const moment = require('moment');
const fs = require('fs');
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'chatadm',
    password: process.env.DB_PASSWORD || 'chatadmpass',
    database: process.env.DB_NAME || 'extchatdb',
  },
  acquireConnectionTimeout: 60000,
});

const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const port = process.env.PORT || 3000;
const app = express();
const server = http.Server(app);
const env = process.env.NODE_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || (env === 'development' ? 'debug' : 'info');
const logDir = 'logs';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
      level: env === 'development' ? 'debug' : 'info',
      colorize: true,
    }),
    new winston.transports.File({
      filename: `${logDir}/error.log`,
      level: 'error',
    }),
    new winston.transports.File({
      filename: `${logDir}/combined.log`,
    }),
  ],
  exitOnError: false,
});

server.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
const socketIO = io.listen(server, {
  logger,
});

if (env === 'development') {
  app.use(express.static('build/development/ChatApp'));
  app.use(express.static('ChatApp'));
  app.use(express.static('ext'));
} else {
  app.use(express.static('build/production/ChatApp'));
}

knex
  .select(knex.raw('1+1 AS result'))
  .then((data) => {
    if (data[0].result === 2) {
      logger.info('MySQL connection established');

      let clientsCount = 0;

      return socketIO.on('connection', (socket) => {
        let user;

        logger.info('Client connected');
        logger.debug(`Client with ID=${socket.client.id} connected from ADDRESS=${socket.handshake.address} on TIME=${socket.handshake.time}`);

        socket.on('login', (packet) => {
          if (user) return;

          logger.info('Client loggged in');
          logger.debug(`USER=${JSON.stringify(user)} with DATA=${JSON.stringify(packet)}`);

          clientsCount += 1;

          user = {
            username: packet.username,
            was_online: moment(0),
          };

          const getLostMessages = () =>
            knex.select([
              'username',
              'post_date',
              'text',
            ])
              .from('messages')
              .join('users', 'user_id', 'users.id')
              .where('post_date', '>', moment(user.was_online).format(dateFormat))
              .orderBy('post_date')
              .map(message => ({
                post_date: moment(message.post_date).format(dateFormat),
                username: message.username,
                message: String(message.text),
              }))
              .then((messages) => {
                socket.emit('user_logged_in', {
                  username: user.username,
                  online: clientsCount,
                  messages,
                });
                socket.broadcast.emit('user_logged_in', {
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
            .where('username', String(packet.username))
            .limit(1)
            .first()
            .then((dbUser) => {
              if (!dbUser) {
                return knex('users')
                  .insert({
                    username: String(packet.username),
                    was_online: moment().format(dateFormat),
                  })
                  .returning('id')
                  .then(id => onUserInsert(id));
              }

              user.id = dbUser.id;
              user.was_online = dbUser.was_online;
              return knex('users')
                .update({
                  was_online: moment().format(dateFormat),
                })
                .where('id', dbUser.id)
                .returning('id')
                .then(id => onUserInsert(id));
            });
        });

        socket.on('starttype', () => {
          if (!user) return;

          logger.info('Client typing message');
          logger.debug(`Typing USER=${JSON.stringify(user)}`);

          socket.broadcast.emit('user_typing_start', {
            username: user.username,
          });
        });

        socket.on('endtype', () => {
          if (!user) return;

          logger.info('Client ended typing');
          logger.debug(`Ended typing USER=${JSON.stringify(user)}`);

          socket.broadcast.emit('user_typing_end', {
            username: user.username,
          });
        });

        socket.on('chat_message', (message) => {
          if (!user) return;

          logger.info('Client sended message');
          logger.debug(`USER=${JSON.stringify(user)} sended MESSAGE=${JSON.stringify(message)}`);

          const postDate = moment().format(dateFormat);

          knex('messages')
            .insert({
              user_id: user.id,
              post_date: postDate,
              text: message,
            })
            .then(() => {
              socket.broadcast.emit('new_message', {
                username: user.username,
                message,
                post_date: postDate,
              });
            });
        });

        const logoutFn = event => () => {
          if (!user) return;

          logger.info('Client logged out');
          logger.debug(`USER=${JSON.stringify(user)}`);

          clientsCount -= 1;

          knex('users')
            .update({
              was_online: moment().format(dateFormat),
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
    }

    throw new Error('Test query failed');
  })
  .catch((err) => {
    logger.error(`Error on connecting mysql database: ${err.stack}`);
    server.close();
  });
