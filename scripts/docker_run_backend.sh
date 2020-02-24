#!/usr/bin/env bash

_OLD_CONTAINER=$(docker ps -aq -f name=chat_backend)
if [[ "${_OLD_CONTAINER}" != "" ]]; then
    docker stop ${_OLD_CONTAINER} > /dev/null
    docker rm --force ${_OLD_CONTAINER} > /dev/null
fi

_MYSQL_DB_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' chat_db)
docker run \
    -dit \
    -e DB_HOST=${_MYSQL_DB_IP} \
    -e DB_USER=chatadm \
    -e DB_PASSWORD=chatadmpass \
    --name chat_backend \
    --restart unless-stopped \
    -p 3000:3000 \
    chat_backend:latest > /dev/null

exit 0
