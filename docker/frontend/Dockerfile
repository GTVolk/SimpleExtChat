FROM devvault/senchacmd:6.5.3.6 AS sencha
COPY [ "assets", "./" ]
RUN	wget -qO- http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip | busybox unzip -q - && \
	mv ./ext-6.2.0 ./ext && \
	cd ChatApp && \
	sencha app build production

FROM nginx:stable-alpine
COPY --from=sencha build/production/ChatApp ./
