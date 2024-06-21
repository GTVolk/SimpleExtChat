FROM node:20.14.0-alpine3.20 AS builder
COPY [ "package.json", "./" ]
RUN npm install --production  && npm cache clean --force

FROM node:20.14.0-alpine3.20
COPY --from=builder node_modules ./node_modules
EXPOSE 3000
COPY index.js .
CMD ["node", "index.js"]
