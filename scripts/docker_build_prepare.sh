#!/usr/bin/env bash

mkdir -p ./docker/context
cp ./package.json ./docker/context
cp ./index.js ./docker/context

npm run assets:build:production

cp -R ./assets/build/production/ChatApp ./docker/context/assets

exit 0
