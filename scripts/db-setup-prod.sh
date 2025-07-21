#!/bin/bash
npx dotenv -e .env.prod -- npm run db:generate
npx dotenv -e .env.prod -- npm run db:migrate
npx dotenv -e .env.prod -- npm run db:seed