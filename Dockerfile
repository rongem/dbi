# specify a base image for compiling node express
FROM node:lts AS backend
WORKDIR /usr/app

# install dependencies
COPY ./backend/package*.json ./
RUN npm install
COPY ./backend/ ./
RUN npm run comp

# specify a base image for compiling angular
FROM node:lts AS frontend
WORKDIR /usr/app

# install dependencies
COPY ./frontend/package*.json ./
RUN npm config set strict-ssl false
RUN npm install
COPY ./frontend/ ./
RUN npm run build

# specify base image for production
FROM node:lts-alpine
WORKDIR /usr/app

# install dependencies
COPY ./backend/package*.json ./
# copy node express backend
COPY --from=backend /usr/app/dist ./dist/
# copy angular frontend
COPY --from=frontend /usr/app/dist/frontend/browser/ ./dist/views/
RUN npm update -g
RUN npm ci

#user context to run in
USER node
# port
EXPOSE 8000
# default command
CMD ["node", "dist/index.js"]

