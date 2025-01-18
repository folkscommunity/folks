# Folks

Folks is a social media platform for product people.

This codebase is primarly built in TypeScript, the web app is built with Next.js and the API is built on top of Express. We use PostgreSQL for the database and Redis for caching.

> [!CAUTION]
> A lot of the codebase is still not production ready, it's still in the early stages of development.

# Development

B

## Prerequisites

- Node.js 20.18.1
- pnpm 9.15+
- PostgreSQL 17 (if you're using mac i recommend using [DBNgin](https://dbngin.com/))
- Redis 7 (same as above, use [DBNgin](https://dbngin.com/))

## Setup

1. Once you have cloned the repo and have the database setup, run `pnpm install` to install all the dependencies.

2. Copy the `.env.example` file to `.env` and fill in the values (you don't need to fill in the AWS values for the time being).

3. Run `pnpm run dev` to start the development server.

4. Open [http://localhost:3000](http://localhost:3000) to view the app.

# Contributing

If you're interested in helping with the community effort to make Folks, let me know in the [Discord server](https://discord.gg/BmWznBhHzk), or shoot me an email [jan@rokita.me](mailto:jan@rokita.me).
