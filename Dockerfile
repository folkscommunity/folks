# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable
RUN corepack prepare pnpm@10.0.0 --activate
RUN apt-get update -y && apt-get install -y openssl ca-certificates

COPY ./package.json /app/package.json
COPY ./pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY ./apps/api/package.json /app/apps/api/package.json
COPY ./apps/web/package.json /app/apps/web/package.json
COPY ./packages /app/packages

WORKDIR /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# Build Stage
FROM base AS build

ENV NODE_ENV=production

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

ARG VERCEL_URL
ENV VERCEL_URL=$VERCEL_URL

# Copy API to Build Stage
COPY ./apps/api/src /app/apps/api/
COPY ./apps/api/tsconfig.json /app/apps/api/tsconfig.json
COPY ./apps/api/eslint.config.mjs /app/apps/api/eslint.config.mjs

# Copy Web to Build Stage
COPY ./apps/web/public /app/apps/web/public
COPY ./apps/web/src /app/apps/web/src
COPY ./apps/web/tsconfig.json /app/apps/web/tsconfig.json
COPY ./apps/web/eslint.config.mjs /app/apps/web/eslint.config.mjs
COPY ./apps/web/next.config.ts /app/apps/web/next.config.ts
COPY ./apps/web/postcss.config.mjs /app/apps/web/postcss.config.mjs
COPY ./apps/web/tailwind.config.ts /app/apps/web/tailwind.config.ts
COPY ./apps/web/sentry.client.config.ts /app/apps/web/sentry.client.config.ts
COPY ./apps/web/sentry.server.config.ts /app/apps/web/sentry.server.config.ts
COPY ./apps/web/sentry.edge.config.ts /app/apps/web/sentry.edge.config.ts

# Copy Packages to Build Stage
COPY ./package.json /app/package.json
COPY ./pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=base /app/apps/web/node_modules /app/apps/web/node_modules

# Copy packages from Base Stage to Build Stage
COPY --from=base /app/packages /app/packages

WORKDIR /app

RUN pnpm run build

# Release Stage
FROM base AS release

ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 3000

CMD [ "pnpm", "start" ]
