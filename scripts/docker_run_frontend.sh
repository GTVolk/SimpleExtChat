#!/usr/bin/env bash

_OLD_CONTAINER=$(docker ps -a -q -f name=chat_frontend)
if [[ "${_OLD_CONTAINER}" != "" ]]; then
    docker rm --force ${_OLD_CONTAINER} > /dev/null
fi

docker run \
    -dit \
    --name chat_frontend \
    --restart unless-stopped \
    -p 8000:80 \
    chat_frontend:latest > /dev/null

exit 0
