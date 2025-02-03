# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@10.0.0 --activate
RUN apt-get update -y && apt-get install -y openssl ca-certificates
COPY . /app
WORKDIR /app

FROM base AS build

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run build

FROM base AS release

ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 3000



CMD [ "pnpm", "start" ]
