#!/usr/bin/env bash

docker build \
    --no-cache \
    -t chat_backend:latest \
    -f ./docker/backend/Dockerfile \
    ./docker/context

exit 0
