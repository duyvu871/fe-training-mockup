#!/bin/bash
dotenv -e .env.prod -- npm run db:generate
dotenv -e .env.prod -- npm run db:migrate
dotenv -e .env.prod -- npm run db:seed