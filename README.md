# 🐍 Snakeeyes Stremio Catalog

A custom Stremio catalog addon featuring curated collections for Movies, TV Shows, Directors, and Decades.

## Install

Click below to install directly in the Stremio desktop app:

**[stremio://az90.ta9446955.workers.dev/manifest.json](stremio://az90.ta9446955.workers.dev/manifest.json)**

If the link above doesn't open Stremio automatically, copy this URL and paste it into Stremio's **Addons → Search/Install via URL** field:

```
https://az90.ta9446955.workers.dev/manifest.json
```

You can also visit the [landing page](https://az90.ta9446955.workers.dev) for a one-click install button.

## What's Included

- Movie Collections (Popular, Award Winning)
- Kids Zone
- Documentaries
- 80s, 90s, 00s Decades
- Drama & Comedy Series
- Horror & Supernatural Shows
- Director Collections (Christopher Nolan, Quentin Tarantino)
- Actor Collections (Leonardo DiCaprio, and more)

## How It Works

This addon is built as a Cloudflare Worker. It serves:

- `/manifest.json` — the addon manifest Stremio uses to discover available catalogs
- `/catalog/:type/:id.json` — catalog listings, pulled live from TMDB
- `/meta/:type/:imdbId.json` — detailed metadata for a specific movie or show

Catalog data is sourced from [The Movie Database (TMDB)](https://www.themoviedb.org/) and mapped to IMDb IDs for compatibility with Stremio.

## Tech Stack

- Cloudflare Workers (with static asset serving for the landing page)
- TMDB API for catalog and metadata
