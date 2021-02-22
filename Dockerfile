# This Dockerfile uses multi-stage builds as recommended in
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
#
# First "stage" is a development image, used to install dependencies and
# build things. It is also used for testing.
# If you want to use an official Node.js image: FROM node:14 AS development
FROM kthse/kth-nodejs:14.0.0 AS development
WORKDIR /usr/src/app

# Copying package*.json files first allows us to use the cached dependencies if
# they haven't changed
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]
RUN apk add --no-cache python make g++

# Why --unsafe-perm?
# > See: https://stackoverflow.com/questions/18136746/npm-install-failed-with-cannot-run-in-wd
RUN npm ci --unsafe-perm
COPY . .
# Add extra build steps if needed: "RUN npm run build" etc

# Second "stage" is a builder image, used to install production dependencies
FROM kthse/kth-nodejs:14.0.0 AS builder
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]

RUN apk add --no-cache python make g++
RUN npm ci --production --unsafe-perm

# Third "stage" is the production image, where we don't install dependencies
# but use the already installed ones.
#
# This way we can deliver an image without the toolchain (python, make, etc)
FROM kthse/kth-nodejs:14.0.0 AS production
COPY --from=builder node_modules node_modules
# Add extra build steps if needed: "COPY --from=development /usr/src/app/dist dist" etc

COPY . .

ADD crontab /etc/crontabs/root
RUN chmod 0644 /etc/crontabs/root

CMD ["crond","-f", "-L", "/dev/stdout"]
