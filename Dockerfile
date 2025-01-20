FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update -y && apt-get install -y openssl
COPY . /app
WORKDIR /app

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run build

FROM base AS release

ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 3000

CMD [ "pnpm", "start" ]
