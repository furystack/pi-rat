FROM node:lts-alpine as base

COPY --chown=node:node /common /home/node/app/common
COPY --chown=node:node /frontend /home/node/app/frontend
COPY --chown=node:node /service /home/node/app/service

COPY --chown=node:node /package.json /home/node/app/package.json
COPY --chown=node:node /.yarn/releases /home/node/app/.yarn/releases
COPY --chown=node:node /.yarn/sdks /home/node/app/.yarn/sdks

# These dependencies are only needed for Yarn PNP
# COPY --chown=node:node /.yarn/unplugged /home/node/app/.yarn/unplugged
# COPY --chown=node:node /.pnp.cjs /home/node/app/.pnp.cjs
# COPY --chown=node:node /.pnp.loader.mjs /home/node/app/.pnp.loader.mjs

COPY --chown=node:node /yarn.lock /home/node/app/yarn.lock
COPY --chown=node:node /tsconfig.json /home/node/app/tsconfig.json
COPY --chown=node:node /.yarnrc.yml /home/node/app/.yarnrc.yml

WORKDIR /home/node/app

RUN yarn workspaces focus service --production

FROM node:lts-alpine as runner

RUN apk upgrade -U \ 
    && apk add ffmpeg \
    && rm -rf /var/cache/*

COPY --chown=node:node --from=base /home/node/app /home/node/app

USER node

ENV E2E_TEMP /home/node/tmp
RUN mkdir /home/node/tmp

EXPOSE 9090
WORKDIR /home/node/app

ENTRYPOINT ["yarn", "start:service"]