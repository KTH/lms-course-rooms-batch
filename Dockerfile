# This Dockerfile uses multi-stage builds as recommended in
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
#
# First "stage" is a development image, used to install dependencies and
# build things. It is also used for testing.
# If you want to use an official Node.js image: FROM node:14 AS development
FROM node:16 AS development
WORKDIR /usr/src/app

# Copying package*.json files first allows us to use the cached dependencies if
# they haven't changed
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]

# Why --unsafe-perm?
# > See: https://stackoverflow.com/questions/18136746/npm-install-failed-with-cannot-run-in-wd
RUN npm ci --unsafe-perm
COPY . .
# Add extra build steps if needed: "RUN npm run build" etc

# Second "stage" is a builder image, used to install production dependencies
FROM node:16 AS builder
WORKDIR /usr/src/app
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]

RUN npm ci --production --unsafe-perm

# Third "stage" is the production image, where we don't install dependencies
# but use the already installed ones.
#
# This way we can deliver an image without the toolchain (python, make, etc)
FROM kthregistry.azurecr.io/small-busybox:latest AS site
FROM node:16-alpine AS production

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules node_modules

# This is needed to start a server with a `_monitor` route.
COPY --from=site /busybox /busybox
COPY --from=site /home/static/httpd.conf /home/static/httpd.conf
EXPOSE 80

# Add extra build steps if needed: "COPY --from=development /usr/src/app/dist dist" etc

COPY . .

ADD crontab /etc/crontabs/root
RUN chmod 0644 /etc/crontabs/root
CMD npx ts-node --transpile-only src/check.ts && /busybox httpd -f -v -p 80 -c /home/static/httpd.conf & crond -f -L /dev/stdout
