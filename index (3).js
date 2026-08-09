// index.js
// Snakeeyes Stremio Catalog Addon — Node.js/Express format for Render.com

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const manifest = {
    id: "community.snakeeyes.catalog",
    version: "1.0.0",
    name: "Snakeeyes Catalog",
    description: "Custom catalogs for Movies, TV Shows, Directors, and Decades.",
    logo: "https://via.placeholder.com/150",
    resources: ["catalog", "meta"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    catalogs: [
        { type: "movie", id: "snakeeyes-popular", name: "Movie Collection (Popular)" },
        { type: "movie", id: "snakeeyes-award", name: "Award Winning Films" },
        { type: "movie", id: "snakeeyes-kids", name: "Kids Zone" },
        { type: "movie", id: "snakeeyes-docs", name: "Documentaries" },
        { type: "movie", id: "snakeeyes-80s", name: "1980s Movies" },
        { type: "movie", id: "snakeeyes-90s", name: "1990s Movies" },
        { type: "movie", id: "snakeeyes-00s", name: "2000s Movies" },
        { type: "series", id: "snakeeyes-drama", name: "Drama Series" },
        { type: "series", id: "snakeeyes-comedy", name: "Comedy Series" },
        { type: "series", id: "snakeeyes-horror", name: "Horror Series" },
        { type: "series", id: "snakeeyes-supernatural", name: "Supernatural Shows" },
        { type: "movie", id: "snakeeyes-nolan", name: "Christopher Nolan Collection" },
        { type: "movie", id: "snakeeyes-tarantino", name: "Quentin Tarantino Collection" },
        { type: "movie", id: "snakeeyes-leanardo", name: "Leonardo DiCaprio Films" }
    ]
};

const catalogMap = {
    "snakeeyes-popular": "movie/popular",
    "snakeeyes-award": "movie/top_rated",
    "snakeeyes-kids": "discover/movie?certification_country=US&certification.lte=G",
    "snakeeyes-docs": "discover/movie?with_genres=99",
    "snakeeyes-80s": "discover/movie?primary_release_date.gte=1980-01-01&primary_release_date.lte=1989-12-31",
    "snakeeyes-90s": "discover/movie?primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31",
    "snakeeyes-00s": "discover/movie?primary_release_date.gte=2000-01-01&primary_release_date.lte=2009-12-31",
    "snakeeyes-drama": "discover/tv?with_genres=18",
    "snakeeyes-comedy": "discover/tv?with_genres=35",
    "snakeeyes-horror": "discover/tv?with_genres=10765",
    "snakeeyes-supernatural": "discover/tv?with_keywords=9715",
    "snakeeyes-nolan": "discover/movie?with_crew=525",
    "snakeeyes-tarantino": "discover/movie?with_crew=138",
    "snakeeyes-leanardo": "discover/movie?with_cast=6193"
};

// Landing page
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
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
    .categories { margin-top: 40px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto; background: #2a2a2a; padding: 20px; border-radius: 10px; }
    ul { columns: 2; }
  </style>
</head>
<body>
  <h1>🐍 Snakeeyes Stremio Catalog</h1>
  <p>The ultimate custom catalog for Movies, TV Shows, Directors, and Decades.</p>
  <a class="btn" href="stremio://${req.get('host')}/manifest.json">Install in Stremio</a>
  <div class="categories">
    <h3>What's Included:</h3>
    <ul>
      <li>Movie Collections</li>
      <li>Kids Zone</li>
      <li>Award Winning Films</li>
      <li>Documentaries</li>
      <li>80s, 90s, 00s Decades</li>
      <li>Drama & Comedy Series</li>
      <li>Horror & Supernatural Shows</li>
      <li>Director Collections (Nolan, Tarantino)</li>
      <li>Actor Collections (DiCaprio, etc.)</li>
    </ul>
  </div>
</body>
</html>`);
});

// Manifest
app.get('/manifest.json', (req, res) => {
    res.json(manifest);
});

// Catalog
app.get('/catalog/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    const tmdbEndpoint = catalogMap[id];

    if (!tmdbEndpoint) {
        return res.json({ metas: [] });
    }

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
        const results = data.results || [];

        const metas = results
            .filter(item => item.imdb_id || item.id)
            .map(item => ({
                id: `tt${item.imdb_id ? item.imdb_id.replace(/^tt/, '') : item.id}`,
                type: type,
                name: item.title || item.name,
                poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
                background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
                description: item.overview
            }));

        res.json({ metas });
    } catch (error) {
        console.error('Catalog error:', error.message);
        res.json({ metas: [] });
    }
});

// Meta
app.get('/meta/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;

    if (!TMDB_API_KEY) {
        return res.json({ meta: {} });
    }

    try {
        let detail = null;

        // Check if it's a real IMDb ID (tt followed by numbers only)
        if (/^tt\d+$/.test(id) && id.length <= 10) {
            // Try TMDB find by IMDb ID first
            const findUrl = `https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
            const findRes = await fetch(findUrl);
            const findData = await findRes.json();

            let tmdbId = null;
            if (type === 'movie' && findData.movie_results && findData.movie_results.length > 0) {
                tmdbId = findData.movie_results[0].id;
            } else if (type === 'series' && findData.tv_results && findData.tv_results.length > 0) {
                tmdbId = findData.tv_results[0].id;
            }

            if (tmdbId) {
                const detailUrl = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}?api_key=${TMDB_API_KEY}`;
                const detailRes = await fetch(detailUrl);
                detail = await detailRes.json();
            }
        } else {
            // It's a TMDB numeric ID prefixed with tt — extract the number
            const tmdbId = id.replace(/^tt/, '');
            const detailUrl = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}?api_key=${TMDB_API_KEY}`;
            const detailRes = await fetch(detailUrl);
            detail = await detailRes.json();
        }

        if (!detail || detail.success === false) return res.json({ meta: {} });

        res.json({
            meta: {
                id: id,
                type: type,
                name: detail.title || detail.name,
                poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
                description: detail.overview,
                releaseInfo: (detail.release_date || detail.first_air_date || '').split('-')[0],
                runtime: type === 'movie' && detail.runtime ? `${detail.runtime} min` : null,
                imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : null
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
