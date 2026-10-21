// index.js
// Snakeeyes Stremio Catalog Addon — Node.js/Express for Render.com
// v3.0 — Fixed franchise collections using correct TMDB endpoints

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

const manifest = {
    id: "community.snakeeyes.catalog",
    version: "3.0.0",
    name: "Snakeeyes Catalog",
    description: "Custom catalogs for Movies, TV Shows, Directors, Decades, and Franchises.",
    logo: "https://via.placeholder.com/150",
    resources: ["catalog", "meta"],
    types: ["movie", "series"],
    idPrefixes: ["tt", "tmdb:"],
    catalogs: [
        // General
        { type: "movie",  id: "snakeeyes-popular",        name: "🔥 Popular Movies" },
        { type: "movie",  id: "snakeeyes-award",          name: "🏆 Award Winning Films" },
        { type: "movie",  id: "snakeeyes-kids",           name: "🧒 Kids Zone" },
        { type: "movie",  id: "snakeeyes-docs",           name: "🎥 Documentaries" },
        // Decades
        { type: "movie",  id: "snakeeyes-80s",            name: "📼 1980s Movies" },
        { type: "movie",  id: "snakeeyes-90s",            name: "📼 1990s Movies" },
        { type: "movie",  id: "snakeeyes-00s",            name: "📼 2000s Movies" },
        // TV Genres
        { type: "series", id: "snakeeyes-drama",          name: "🎭 Drama Series" },
        { type: "series", id: "snakeeyes-comedy",         name: "😂 Comedy Series" },
        { type: "series", id: "snakeeyes-horror-tv",      name: "👻 Horror Series" },
        { type: "series", id: "snakeeyes-supernatural",   name: "🔮 Supernatural Shows" },
        // Directors
        { type: "movie",  id: "snakeeyes-nolan",          name: "🎬 Christopher Nolan Collection" },
        { type: "movie",  id: "snakeeyes-tarantino",      name: "🎬 Quentin Tarantino Collection" },
        // Actors
        { type: "movie",  id: "snakeeyes-leo",            name: "🌟 Leonardo DiCaprio Films" },
        // Horror Franchises
        { type: "movie",  id: "snakeeyes-horror",         name: "🔪 Horror Movies" },
        { type: "movie",  id: "snakeeyes-insidious",      name: "👁️ Insidious Collection" },
        { type: "movie",  id: "snakeeyes-hellraiser",     name: "😈 Hellraiser Collection" },
        // Action Franchises — Movies
        { type: "movie",  id: "snakeeyes-lotr",           name: "💍 Lord of the Rings" },
        { type: "movie",  id: "snakeeyes-johnwick",       name: "🐶 John Wick Collection" },
        { type: "movie",  id: "snakeeyes-transformers",   name: "🤖 Transformers Collection" },
        { type: "movie",  id: "snakeeyes-xmen",           name: "⚡ X-Men Collection" },
        { type: "movie",  id: "snakeeyes-starwars",       name: "⭐ Star Wars Collection" },
        { type: "movie",  id: "snakeeyes-fastnfurious",   name: "🚗 Fast & Furious Collection" },
        { type: "movie",  id: "snakeeyes-superman",       name: "🦸 Superman Films" },
        { type: "movie",  id: "snakeeyes-batman",         name: "🦇 Batman Films" },
        // Franchise TV Shows
        { type: "series", id: "snakeeyes-starwars-tv",   name: "⭐ Star Wars TV Shows" },
        { type: "series", id: "snakeeyes-xmen-tv",        name: "⚡ X-Men Animated Series" },
        { type: "series", id: "snakeeyes-transformers-tv",name: "🤖 Transformers Animated" },
        { type: "series", id: "snakeeyes-batman-tv",      name: "🦇 Batman TV Series" },
        { type: "series", id: "snakeeyes-superman-tv",    name: "🦸 Superman TV Series" }
    ]
};

// Each entry: { type, endpoint }
// type "discover" = /discover/movie or /discover/tv
// type "collection" = /collection/{id} — returns parts[] directly
// type "person_movies" = /person/{id}/movie_credits — returns cast[]
// type "person_tv" = /person/{id}/tv_credits — returns cast[]
// type "search_tv" = multiple /search/tv queries, merged
const catalogConfig = {
    // General
    "snakeeyes-popular":        { type: "discover", endpoint: "movie/popular" },
    "snakeeyes-award":          { type: "discover", endpoint: "movie/top_rated" },
    "snakeeyes-kids":           { type: "discover", endpoint: "discover/movie?certification_country=US&certification.lte=G&sort_by=popularity.desc" },
    "snakeeyes-docs":           { type: "discover", endpoint: "discover/movie?with_genres=99&sort_by=popularity.desc" },
    // Decades
    "snakeeyes-80s":            { type: "discover", endpoint: "discover/movie?primary_release_date.gte=1980-01-01&primary_release_date.lte=1989-12-31&sort_by=popularity.desc" },
    "snakeeyes-90s":            { type: "discover", endpoint: "discover/movie?primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31&sort_by=popularity.desc" },
    "snakeeyes-00s":            { type: "discover", endpoint: "discover/movie?primary_release_date.gte=2000-01-01&primary_release_date.lte=2009-12-31&sort_by=popularity.desc" },
    // TV Genres
    "snakeeyes-drama":          { type: "discover", endpoint: "discover/tv?with_genres=18&sort_by=popularity.desc" },
    "snakeeyes-comedy":         { type: "discover", endpoint: "discover/tv?with_genres=35&sort_by=popularity.desc" },
    "snakeeyes-horror-tv":      { type: "discover", endpoint: "discover/tv?with_genres=9648&sort_by=popularity.desc" },
    "snakeeyes-supernatural":   { type: "discover", endpoint: "discover/tv?with_genres=10765&sort_by=popularity.desc" },
    // Directors (person movie credits)
    "snakeeyes-nolan":          { type: "person_movies", personId: "525" },
    "snakeeyes-tarantino":      { type: "person_movies", personId: "138" },
    // Actors
    "snakeeyes-leo":            { type: "person_movies", personId: "6193" },
    // Horror
    "snakeeyes-horror":         { type: "discover", endpoint: "discover/movie?with_genres=27&sort_by=popularity.desc" },
    // TMDB Collection IDs (most reliable for franchises)
    "snakeeyes-insidious":      { type: "collection", collectionId: "228446" },  // Insidious Collection
    "snakeeyes-hellraiser":     { type: "collection", collectionId: "460418" },  // Hellraiser Collection
    "snakeeyes-lotr":           { type: "collection", collectionId: "119" },     // Lord of the Rings
    "snakeeyes-johnwick":       { type: "collection", collectionId: "404609" },  // John Wick
    "snakeeyes-transformers":   { type: "collection", collectionId: "8650" },    // Transformers
    "snakeeyes-xmen":           { type: "collection", collectionId: "748" },     // X-Men
    "snakeeyes-starwars":       { type: "collection", collectionId: "10" },      // Star Wars
    "snakeeyes-fastnfurious":   { type: "collection", collectionId: "9485" },    // Fast & Furious
    "snakeeyes-superman":       { type: "collection", collectionId: "863151" },  // Superman Legacy collection; fallback to discover below
    "snakeeyes-batman":         { type: "collection", collectionId: "948485" },  // Batman Collection
    // TV Franchise shows — searched by name since TMDB has no single collection for TV
    "snakeeyes-starwars-tv":    { type: "search_tv", queries: ["The Mandalorian", "Andor", "Obi-Wan Kenobi", "The Book of Boba Fett", "Ahsoka", "Star Wars The Clone Wars", "Star Wars Rebels", "The Acolyte"] },
    "snakeeyes-xmen-tv":        { type: "search_tv", queries: ["X-Men The Animated Series", "X-Men Evolution", "Wolverine and the X-Men", "X-Men 97"] },
    "snakeeyes-transformers-tv":{ type: "search_tv", queries: ["Transformers Generation 1", "Transformers Animated", "Transformers Prime", "Transformers Robots in Disguise", "Transformers Cyberverse"] },
    "snakeeyes-batman-tv":      { type: "search_tv", queries: ["Batman The Animated Series", "The Batman", "Batman Beyond", "Gotham", "Batwoman", "Batman Caped Crusader"] },
    "snakeeyes-superman-tv":    { type: "search_tv", queries: ["Superman The Animated Series", "Smallville", "Superman and Lois", "My Adventures with Superman"] }
};

// Helper: build proper Stremio ID
function buildId(item) {
    if (item.imdb_id && /^tt\d+$/.test(item.imdb_id)) return item.imdb_id;
    return `tmdb:${item.id}`;
}

// Helper: map a TMDB movie result to Stremio meta
function movieToMeta(item) {
    return {
        id: buildId(item),
        type: "movie",
        name: item.title || item.name || 'Unknown',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        description: item.overview || ''
    };
}

// Helper: map a TMDB TV result to Stremio meta
function tvToMeta(item) {
    return {
        id: buildId(item),
        type: "series",
        name: item.name || item.title || 'Unknown',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        description: item.overview || ''
    };
}

// Fetch metas for a catalog entry
async function fetchMetas(catalogId, type) {
    const config = catalogConfig[catalogId];
    if (!config) return [];

    const key = `api_key=${TMDB_API_KEY}`;

    if (config.type === "discover") {
        const sep = config.endpoint.includes('?') ? '&' : '?';
        const url = `${TMDB_BASE}/${config.endpoint}${sep}${key}`;
        const res = await fetch(url);
        const data = await res.json();
        const results = data.results || [];
        return type === "series" ? results.map(tvToMeta) : results.map(movieToMeta);
    }

    if (config.type === "collection") {
        const url = `${TMDB_BASE}/collection/${config.collectionId}?${key}`;
        const res = await fetch(url);
        if (!res.ok) {
            // Fallback: try discover with company/keyword search
            return [];
        }
        const data = await res.json();
        const parts = data.parts || [];
        // Sort by release date ascending
        parts.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
        return parts.map(movieToMeta);
    }

    if (config.type === "person_movies") {
        const url = `${TMDB_BASE}/person/${config.personId}/movie_credits?${key}`;
        const res = await fetch(url);
        const data = await res.json();
        const cast = (data.crew || data.cast || []);
        // Sort by popularity desc
        cast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        return cast.slice(0, 20).map(movieToMeta);
    }

    if (config.type === "person_tv") {
        const url = `${TMDB_BASE}/person/${config.personId}/tv_credits?${key}`;
        const res = await fetch(url);
        const data = await res.json();
        const cast = (data.cast || []);
        cast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        return cast.slice(0, 20).map(tvToMeta);
    }

    if (config.type === "search_tv") {
        // Search each show by name and take the top result
        const results = [];
        for (const query of config.queries) {
            const url = `${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&${key}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                results.push(tvToMeta(data.results[0]));
            }
        }
        return results;
    }

    return [];
}

// Landing page
app.get('/', (req, res) => {
    const host = req.get('host');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snakeeyes Stremio Catalog</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #1a1a1a; color: white; text-align: center; padding: 50px; }
    h1 { color: #7b5cff; }
    .btn { background-color: #7b5cff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 1.2em; display: inline-block; margin-top: 20px; }
    .btn:hover { background-color: #6245e0; }
    .categories { margin-top: 40px; text-align: left; max-width: 700px; margin-left: auto; margin-right: auto; background: #2a2a2a; padding: 20px; border-radius: 10px; }
    ul { columns: 2; }
  </style>
</head>
<body>
  <h1>🐍 Snakeeyes Stremio Catalog</h1>
  <p>The ultimate custom catalog for Movies, TV Shows, Directors, Decades, and Franchises.</p>
  <a class="btn" href="stremio://${host}/manifest.json">Install in Stremio</a>
  <div class="categories">
    <h3>What's Included:</h3>
    <ul>
      <li>🔥 Popular & Award Films</li>
      <li>🧒 Kids Zone & Docs</li>
      <li>📼 80s, 90s, 00s Decades</li>
      <li>🎭 Drama, Comedy, Horror TV</li>
      <li>🎬 Nolan & Tarantino</li>
      <li>💍 Lord of the Rings</li>
      <li>⭐ Star Wars (Movies + TV)</li>
      <li>🐶 John Wick</li>
      <li>🤖 Transformers (Movies + TV)</li>
      <li>⚡ X-Men (Movies + TV)</li>
      <li>🚗 Fast & Furious</li>
      <li>🦸 Superman (Movies + TV)</li>
      <li>🦇 Batman (Movies + TV)</li>
      <li>👁️ Insidious Collection</li>
      <li>😈 Hellraiser Collection</li>
      <li>🔪 Horror Movies</li>
    </ul>
  </div>
</body>
</html>`);
});

// Manifest
app.get('/manifest.json', (req, res) => res.json(manifest));

// Catalog
app.get('/catalog/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    if (!TMDB_API_KEY) {
        console.error('TMDB_API_KEY not set');
        return res.json({ metas: [] });
    }
    try {
        const metas = await fetchMetas(id, type);
        res.json({ metas: metas.filter(m => m.name !== 'Unknown') });
    } catch (err) {
        console.error('Catalog error:', err.message);
        res.json({ metas: [] });
    }
});

// Meta — supports tt IMDb IDs and tmdb: prefixed IDs
app.get('/meta/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    if (!TMDB_API_KEY) return res.json({ meta: {} });

    try {
        const mediaType = type === 'series' ? 'tv' : 'movie';
        const key = `api_key=${TMDB_API_KEY}`;
        let detail = null;

        if (id.startsWith('tmdb:')) {
            const tmdbId = id.replace('tmdb:', '');
            const r = await fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}?${key}`);
            detail = await r.json();
        } else if (/^tt\d+$/.test(id)) {
            const findR = await fetch(`${TMDB_BASE}/find/${id}?${key}&external_source=imdb_id`);
            const findData = await findR.json();
            let tmdbId = null;
            if (mediaType === 'movie' && findData.movie_results?.length > 0) tmdbId = findData.movie_results[0].id;
            else if (mediaType === 'tv' && findData.tv_results?.length > 0) tmdbId = findData.tv_results[0].id;
            if (tmdbId) {
                const r = await fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}?${key}`);
                detail = await r.json();
            }
        }

        if (!detail || detail.success === false) return res.json({ meta: {} });

        res.json({
            meta: {
                id,
                type,
                name: detail.title || detail.name || '',
                poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
                description: detail.overview || '',
                releaseInfo: (detail.release_date || detail.first_air_date || '').split('-')[0],
                runtime: type === 'movie' && detail.runtime ? `${detail.runtime} min` : null,
                imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : null
            }
        });
    } catch (err) {
        console.error('Meta error:', err.message);
        res.json({ meta: {} });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', tmdb: TMDB_API_KEY ? 'set' : 'NOT SET' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Snakeeyes Catalog v3.0 running on port ${PORT}`);
    if (!TMDB_API_KEY) console.warn('WARNING: TMDB_API_KEY is not set');
});
