# SimpleExtChat
Simple ExtJS Chat App

## Requirements
- ExtJS 6.2.0+ (http://cdn.sencha.com/ext/gpl/ext-6.2.0-gpl.zip)
- SenchaCmd 6.2.1+ (https://www.sencha.com/products/extjs/cmd-download/)

### If you want run throught Docker
- Docker (https://www.docker.com/get-docker)
- Docker Compose (https://docs.docker.com/compose/install/)

### OR if you want run locally
- NodeJS 6.x+ (https://nodejs.org/en/download/)
- MySQL Server 5.5+ (https://www.mysql.com/downloads/)

## Installation
- Open terminal window
- Change workdir to downloaded repository
- Type `npm i && npm run build`
### Docker
- Type `docker-compose up`
### Local installation
- Type `npm run start`

## TODO
- Mobile ExtJS Modern version OR mobile alignment OR React version
- Message styling by SASS and theme vars
- Show message time, user online status (and maybe some other stuff...)
- New message highlight
- Event sounds with mute option
- Online users list (With offline list too)
- Typing, logout, login in chat box not by toast
- Users avatars or GRAVATAR support
- Emoji and custom emoji
- Client authorization and registration (Sign in with Google/VK/Yandex/Facebook and etc...)
- User profiles and groups (User, Admin, Superadmin...)
- Settings
- Client moderation (Ban, Kick, Filters, Ignore...)
- Edit, Delete message (with restrict period)
- Push messages (offline too)
- Chat rooms, private and public chats
- Jabber or other remote connection protocol support
- Calls with SIP/WebRTC
- Bots and robots. plugins support
- API, SDK
- More bug fixes
- Refactoring
