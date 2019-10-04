#!/usr/bin/env bash

_OLD_CONTAINER=$(docker ps -a -q -f name=chat_db)
if [[ "${_OLD_CONTAINER}" != "" ]]; then
    docker stop ${_OLD_CONTAINER} > /dev/null
    docker rm --force ${_OLD_CONTAINER} > /dev/null
fi

docker run \
    -dit \
    -v $PWD/sql:/docker-entrypoint-initdb.d \
    -v chat_db_data:/var/lib/mysql \
    -e MYSQL_USER=chatadm \
    -e MYSQL_DATABASE=extchatdb \
    -e MYSQL_PASSWORD=chatadmpass \
    -e MYSQL_RANDOM_ROOT_PASSWORD=1 \
    --name chat_db \
    --restart unless-stopped \
    mysql:5 > /dev/null

exit 0
