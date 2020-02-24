FROM node:lts-alpine AS builder
COPY package.json .
RUN npm install --production

FROM node:lts-alpine
COPY --from=builder node_modules ./node_modules
EXPOSE 3000
COPY index.js .
CMD ["node", "index.js"]
