FROM devvault/senchacmd:6.5.3.6 AS sencha
RUN mkdir -p /opt/app
COPY [ "assets", "/opt/app/" ]
RUN	cd /opt/app && \
	wget -qO- http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip | busybox unzip -q - && \
	mv ./ext-6.2.0 ./ext && \
	cd ChatApp && \
	sencha app build production

FROM nginx:1.24-alpine
COPY --from=sencha /opt/app/build/production/ChatApp /usr/share/nginx/html
