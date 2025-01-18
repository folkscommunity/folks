FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update -y && apt-get install -y openssl
COPY . /app
WORKDIR /app

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base

ENV NODE_ENV=production

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/.next /app/apps/web/.next

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s CMD curl -f http://localhost:3000/ || exit 1

CMD [ "pnpm", "start" ]
