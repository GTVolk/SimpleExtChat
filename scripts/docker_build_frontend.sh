#!/usr/bin/env bash

docker build \
    --no-cache \
    -t chat_frontend:latest \
    -f ./docker/frontend/Dockerfile \
    ./docker/context

exit 0
