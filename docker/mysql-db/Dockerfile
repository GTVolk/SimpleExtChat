FROM mysql:latest

ENV MYSQL_ALLOW_EMPTY_PASSWORD yes

ADD ./sql /docker-entrypoint-initdb.d

EXPOSE 3306