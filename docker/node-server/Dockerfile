FROM node:latest

RUN mkdir /opt/chatserver

ADD ./server.js /opt/chatserver
ADD ./package.json /opt/chatserver

WORKDIR /opt/chatserver
RUN npm install --production

EXPOSE 3000

CMD ["node", "/opt/chatserver/server.js"]