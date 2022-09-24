FROM node:18-alpine as base

COPY --chown=node:node /common /home/node/app/common
COPY --chown=node:node /frontend /home/node/app/frontend
COPY --chown=node:node /service /home/node/app/service

COPY --chown=node:node /package.json /home/node/app/package.json
COPY --chown=node:node /.yarn/plugins /home/node/app/.yarn/plugins
COPY --chown=node:node /.yarn/releases /home/node/app/.yarn/releases
COPY --chown=node:node /.yarn/sdks /home/node/app/.yarn/sdks
COPY --chown=node:node /yarn.lock /home/node/app/yarn.lock
COPY --chown=node:node /tsconfig.json /home/node/app/tsconfig.json
COPY --chown=node:node /.yarnrc.yml /home/node/app/.yarnrc.yml

WORKDIR /home/node/app

RUN yarn install --immutable && yarn build && yarn cache clean
RUN yarn workspaces focus service --production

FROM node:18-alpine as runner

COPY --chown=node:node --from=base /home/node/app /home/node/app

WORKDIR /home/node/app
USER node

EXPOSE 9090

ENTRYPOINT ["yarn", "start:service"]