<p align="left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.rokita.me/folks/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://cdn.rokita.me/folks/logo.svg">
    <img alt="Folks" src="https://cdn.rokita.me/folks/logo.svg" width="250px">
  </picture>
</p>
<p></p>

Folks is a community platform for product people.

Check out the [manifest](https://folkscommunity.com/manifest) for more information about the project.

This codebase is primarly built in TypeScript, the web app is built with Next.js and the API is built on top of Express. We use PostgreSQL for the database and Redis for caching.

# Development

Here's a guide on how to get started with a local development environment for Folks.

## Prerequisites

- Node.js 20.18.1
- pnpm 9.15+
- PostgreSQL 17 (if you're using mac i recommend using [DBNgin](https://dbngin.com/))
- Redis 7 (same as above, use [DBNgin](https://dbngin.com/))
- AWS S3 bucket for static assets.
- AWS SES for sending emails.
- AWS Rekognition for image scanning.

## Setup

1. Once you have cloned the repo and have the database setup, run `pnpm install` to install all the dependencies.

2. Generate Vapid keys for the PWA by running `pnpx web-push generate-vapid-keys`.

3. Copy the `.env.example` file to `.env` and fill in the values (you need to fill in the AWS values you can find the Policy [here](https://github.com/folkscommunity/folks/blob/main/docs/infrastructure.md)).

4. Run `pnpm run dev` to start the development server.

5. Open [http://localhost:3000](http://localhost:3000) to view the app.

# Contributing

If you're interested in helping with the community effort to make Folks, let me know in the [Discord server](https://discord.gg/BmWznBhHzk), or shoot me an email [j@folkscommunity.com](mailto:j@folkscommunity.com).
