// index.js
// Snakeeyes Stremio Catalog Addon — Node.js/Express for Render.com

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const manifest = {
    id: "community.snakeeyes.catalog",
    version: "2.0.0",
    name: "Snakeeyes Catalog",
    description: "Custom catalogs for Movies, TV Shows, Directors, Decades, and Franchises.",
    logo: "https://via.placeholder.com/150",
    resources: ["catalog", "meta"],
    types: ["movie", "series"],
    idPrefixes: ["tt", "tmdb:"],
    catalogs: [
        // --- General ---
        { type: "movie", id: "snakeeyes-popular",      name: "🔥 Popular Movies" },
        { type: "movie", id: "snakeeyes-award",        name: "🏆 Award Winning Films" },
        { type: "movie", id: "snakeeyes-kids",         name: "🧒 Kids Zone" },
        { type: "movie", id: "snakeeyes-docs",         name: "🎥 Documentaries" },
        // --- Decades ---
        { type: "movie", id: "snakeeyes-80s",          name: "📼 1980s Movies" },
        { type: "movie", id: "snakeeyes-90s",          name: "📼 1990s Movies" },
        { type: "movie", id: "snakeeyes-00s",          name: "📼 2000s Movies" },
        // --- TV Genres ---
        { type: "series", id: "snakeeyes-drama",       name: "🎭 Drama Series" },
        { type: "series", id: "snakeeyes-comedy",      name: "😂 Comedy Series" },
        { type: "series", id: "snakeeyes-horror-tv",   name: "👻 Horror Series" },
        { type: "series", id: "snakeeyes-supernatural",name: "🔮 Supernatural Shows" },
        // --- Director Collections ---
        { type: "movie", id: "snakeeyes-nolan",        name: "🎬 Christopher Nolan Collection" },
        { type: "movie", id: "snakeeyes-tarantino",    name: "🎬 Quentin Tarantino Collection" },
        // --- Actor Collections ---
        { type: "movie", id: "snakeeyes-leo",          name: "🌟 Leonardo DiCaprio Films" },
        // --- Horror Franchises ---
        { type: "movie", id: "snakeeyes-horror",       name: "🔪 Horror Movies" },
        { type: "movie", id: "snakeeyes-insidious",    name: "👁️ Insidious Collection" },
        { type: "movie", id: "snakeeyes-hellraiser",   name: "😈 Hellraiser Collection" },
        // --- Action Franchises (Movies) ---
        { type: "movie", id: "snakeeyes-lotr",         name: "💍 Lord of the Rings" },
        { type: "movie", id: "snakeeyes-johnwick",     name: "🐶 John Wick Collection" },
        { type: "movie", id: "snakeeyes-transformers", name: "🤖 Transformers Collection" },
        { type: "movie", id: "snakeeyes-xmen",         name: "⚡ X-Men Collection" },
        { type: "movie", id: "snakeeyes-starwars",     name: "⭐ Star Wars Collection" },
        { type: "movie", id: "snakeeyes-fastnfurious", name: "🚗 Fast & Furious Collection" },
        { type: "movie", id: "snakeeyes-superman",     name: "🦸 Superman Films" },
        { type: "movie", id: "snakeeyes-batman",       name: "🦇 Batman Films" },
        // --- Franchise TV Shows ---
        { type: "series", id: "snakeeyes-starwars-tv", name: "⭐ Star Wars TV Shows" },
        { type: "series", id: "snakeeyes-xmen-tv",     name: "⚡ X-Men / Marvel Animated" },
        { type: "series", id: "snakeeyes-transformers-tv", name: "🤖 Transformers Animated" },
        { type: "series", id: "snakeeyes-batman-tv",   name: "🦇 Batman TV Series" },
        { type: "series", id: "snakeeyes-superman-tv", name: "🦸 Superman TV Series" }
    ]
};

// TMDB endpoint map
const catalogMap = {
    // General
    "snakeeyes-popular":        "movie/popular",
    "snakeeyes-award":          "movie/top_rated",
    "snakeeyes-kids":           "discover/movie?certification_country=US&certification.lte=G",
    "snakeeyes-docs":           "discover/movie?with_genres=99",
    // Decades
    "snakeeyes-80s":            "discover/movie?primary_release_date.gte=1980-01-01&primary_release_date.lte=1989-12-31",
    "snakeeyes-90s":            "discover/movie?primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31",
    "snakeeyes-00s":            "discover/movie?primary_release_date.gte=2000-01-01&primary_release_date.lte=2009-12-31",
    // TV Genres
    "snakeeyes-drama":          "discover/tv?with_genres=18",
    "snakeeyes-comedy":         "discover/tv?with_genres=35",
    "snakeeyes-horror-tv":      "discover/tv?with_genres=9648",
    "snakeeyes-supernatural":   "discover/tv?with_keywords=9715",
    // Directors
    "snakeeyes-nolan":          "discover/movie?with_crew=525",
    "snakeeyes-tarantino":      "discover/movie?with_crew=138",
    // Actors
    "snakeeyes-leo":            "discover/movie?with_cast=6193",
    // Horror
    "snakeeyes-horror":         "discover/movie?with_genres=27&sort_by=popularity.desc",
    "snakeeyes-insidious":      "discover/movie?with_collections=228446",
    "snakeeyes-hellraiser":     "discover/movie?with_keywords=10180&sort_by=release_date.asc",
    // Action Franchises (Movies)
    "snakeeyes-lotr":           "discover/movie?with_collection=119",
    "snakeeyes-johnwick":       "discover/movie?with_collection=404609",
    "snakeeyes-transformers":   "discover/movie?with_collection=8650",
    "snakeeyes-xmen":           "discover/movie?with_collection=748",
    "snakeeyes-starwars":       "discover/movie?with_collection=10",
    "snakeeyes-fastnfurious":   "discover/movie?with_collection=9485",
    "snakeeyes-superman":       "discover/movie?with_keywords=186641&sort_by=release_date.asc",
    "snakeeyes-batman":         "discover/movie?with_keywords=849&sort_by=release_date.asc",
    // Franchise TV
    "snakeeyes-starwars-tv":    "discover/tv?with_keywords=161252&sort_by=first_air_date.asc",
    "snakeeyes-xmen-tv":        "discover/tv?with_keywords=7006&sort_by=first_air_date.asc",
    "snakeeyes-transformers-tv":"discover/tv?with_keywords=3564&sort_by=first_air_date.asc",
    "snakeeyes-batman-tv":      "discover/tv?with_keywords=849&sort_by=first_air_date.asc",
    "snakeeyes-superman-tv":    "discover/tv?with_keywords=186641&sort_by=first_air_date.asc"
};

// Helper: build a proper Stremio ID from a TMDB result
function buildId(item) {
    if (item.imdb_id && /^tt\d+$/.test(item.imdb_id)) {
        return item.imdb_id;
    }
    return `tmdb:${item.id}`;
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
      <li>🧒 Kids Zone</li>
      <li>🎥 Documentaries</li>
      <li>📼 80s, 90s, 00s Decades</li>
      <li>🎭 Drama, Comedy, Horror TV</li>
      <li>🎬 Nolan & Tarantino Collections</li>
      <li>💍 Lord of the Rings</li>
      <li>⭐ Star Wars (Movies + TV)</li>
      <li>🐶 John Wick Collection</li>
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
app.get('/manifest.json', (req, res) => {
    res.json(manifest);
});

// Catalog handler
app.get('/catalog/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const tmdbEndpoint = catalogMap[id];

    if (!tmdbEndpoint) return res.json({ metas: [] });
    if (!TMDB_API_KEY) {
        console.error('TMDB_API_KEY is not set');
        return res.json({ metas: [] });
    }

    try {
        const separator = tmdbEndpoint.includes('?') ? '&' : '?';
        const tmdbUrl = `https://api.themoviedb.org/3/${tmdbEndpoint}${separator}api_key=${TMDB_API_KEY}`;
        const response = await fetch(tmdbUrl);

        if (!response.ok) {
            console.error(`TMDB error: ${response.status}`);
            return res.json({ metas: [] });
        }

        const data = await response.json();
        const results = data.results || data.parts || [];

        const metas = results.map(item => ({
            id: buildId(item),
            type: type,
            name: item.title || item.name || 'Unknown',
            poster: item.poster_path
                ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
                : null,
            background: item.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
                : null,
            description: item.overview || ''
        })).filter(m => m.name !== 'Unknown');

        res.json({ metas });
    } catch (error) {
        console.error('Catalog error:', error.message);
        res.json({ metas: [] });
    }
});

// Meta handler — supports both tt IMDb IDs and tmdb: prefixed IDs
app.get('/meta/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    if (!TMDB_API_KEY) return res.json({ meta: {} });

    try {
        let detail = null;
        const mediaType = type === 'series' ? 'tv' : 'movie';

        if (id.startsWith('tmdb:')) {
            // Direct TMDB ID
            const tmdbId = id.replace('tmdb:', '');
            const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
            const res2 = await fetch(url);
            detail = await res2.json();
        } else if (/^tt\d+$/.test(id)) {
            // Real IMDb ID — look up via TMDB find endpoint
            const findUrl = `https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
            const findRes = await fetch(findUrl);
            const findData = await findRes.json();

            let tmdbId = null;
            if (mediaType === 'movie' && findData.movie_results?.length > 0) {
                tmdbId = findData.movie_results[0].id;
            } else if (mediaType === 'tv' && findData.tv_results?.length > 0) {
                tmdbId = findData.tv_results[0].id;
            }

            if (tmdbId) {
                const detailUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
                const detailRes = await fetch(detailUrl);
                detail = await detailRes.json();
            }
        }

        if (!detail || detail.success === false) return res.json({ meta: {} });

        res.json({
            meta: {
                id: id,
                type: type,
                name: detail.title || detail.name || '',
                poster: detail.poster_path
                    ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
                    : null,
                background: detail.backdrop_path
                    ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
                    : null,
                description: detail.overview || '',
                releaseInfo: (detail.release_date || detail.first_air_date || '').split('-')[0],
                runtime: type === 'movie' && detail.runtime
                    ? `${detail.runtime} min`
                    : null,
                imdbRating: detail.vote_average
                    ? detail.vote_average.toFixed(1)
                    : null
            }
        });
    } catch (error) {
        console.error('Meta error:', error.message);
        res.json({ meta: {} });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', tmdb: TMDB_API_KEY ? 'set' : 'NOT SET' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Snakeeyes Catalog running on port ${PORT}`);
    if (!TMDB_API_KEY) console.warn('WARNING: TMDB_API_KEY is not set');
});
