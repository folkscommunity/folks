<p align="left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.rokita.me/folks/logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://cdn.rokita.me/folks/logo.svg">
    <img alt="Folks" src="https://cdn.rokita.me/folks/logo.svg" width="250px">
  </picture>
</p>
<p></p>

Folks is a community platform for creative people.

Check out the [manifesto](https://folkscommunity.com/manifesto) for more information about the project.

This codebase is primarly built in TypeScript, the web app is built with Next.js and the API is built on top of Express. We use PostgreSQL for the database and Redis for caching.

# Development

Here's a guide on how to get started with a local development environment for Folks.

## Prerequisites

- Node.js 20.18.1
- pnpm 9.15+
- PostgreSQL 17 (if you're using mac i recommend using [DBNgin](https://dbngin.com/))
- Redis 7 (same as above, use [DBNgin](https://dbngin.com/))
- AWS S3 bucket for static assets. (Not required for development.)
- AWS SES for sending emails. (Not required for development.)
- AWS Rekognition for image scanning. (Not required for development.)

## Basic Setup

1. Turn on the PostgreSQL and Redis services (in DBNgin).

2. Run `scripts/setup` to setup the environment, and create a `.env` file.

3. Run `pnpm run dev` to start the development server.

4. Open [http://localhost:3000](http://localhost:3000) to view the app.

(When you register a user the verify link will appear in the console.)

# Contributing

If you're interested in helping with the community effort to make Folks, let me know in the [Discord server](https://discord.gg/BmWznBhHzk), or shoot me an email [j@folkscommunity.com](mailto:j@folkscommunity.com).

---

## Acknowledgements

**Thank you to [Sentry](https://sentry.io?utm_source=folks) for providing us with error reporting and monitoring.**
