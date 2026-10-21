// index.js
// Snakeeyes Stremio Catalog Addon — Node.js/Express for Render.com
// v3.6 — Cleaned to only the requested categories: 80s, 90s, 00s, Kids, Docs, Drama, Comedy, Horror, Supernatural Horror

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

const manifest = {
    id: 'community.snakeeyes.catalog',
    version: '3.6.0',
    name: 'Snakeeyes Catalog',
    description: '1980s, 1990s, 2000s movies, kids, documentaries, drama, comedy, horror, and supernatural horror.',
    logo: 'https://via.placeholder.com/150',
    resources: ['catalog', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: [
        { type: 'movie', id: 'snakeeyes-80s', name: '📼 1980s Movies' },
        { type: 'movie', id: 'snakeeyes-90s', name: '📼 1990s Movies' },
        { type: 'movie', id: 'snakeeyes-00s', name: '📼 2000s Movies' },
        { type: 'movie', id: 'snakeeyes-kids', name: '🧒 Kids Zone' },
        { type: 'movie', id: 'snakeeyes-docs', name: '🎥 Documentaries' },
        { type: 'series', id: 'snakeeyes-drama', name: '🎭 Drama Series' },
        { type: 'series', id: 'snakeeyes-comedy', name: '😂 Comedy Series' },
        { type: 'series', id: 'snakeeyes-horror-tv', name: '👻 Horror Series' },
        { type: 'series', id: 'snakeeyes-supernatural', name: '🔮 Supernatural Horror Shows' },
        { type: 'movie', id: 'snakeeyes-horror', name: '🔪 Horror Movies' }
    ]
};

const catalogConfig = {
    'snakeeyes-kids': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_genres=16,10751&sort_by=popularity.desc',
        fallbackQueries: ['kids movies', 'family friendly movies', 'animated family movies']
    },
    'snakeeyes-docs': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_genres=99&sort_by=popularity.desc',
        fallbackQueries: ['documentary films', 'history documentary', 'nature documentary']
    },
    'snakeeyes-80s': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&primary_release_date.gte=1980-01-01&primary_release_date.lte=1989-12-31&sort_by=popularity.desc',
        fallbackQueries: ['1980s movies', 'classic 80s films', '80s horror movies']
    },
    'snakeeyes-90s': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31&sort_by=popularity.desc',
        fallbackQueries: ['1990s movies', 'classic 90s films', '90s horror movies']
    },
    'snakeeyes-00s': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&primary_release_date.gte=2000-01-01&primary_release_date.lte=2009-12-31&sort_by=popularity.desc',
        fallbackQueries: ['2000s movies', 'classic 2000s films', '2000s horror movies']
    },
    'snakeeyes-drama': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=18&sort_by=popularity.desc',
        fallbackQueries: ['drama series', 'best drama shows', 'critically acclaimed drama series']
    },
    'snakeeyes-comedy': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=35&sort_by=popularity.desc',
        fallbackQueries: ['comedy series', 'funny shows', 'sitcoms']
    },
    'snakeeyes-horror-tv': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=27&sort_by=popularity.desc',
        fallbackQueries: ['horror series', 'scary tv shows', 'supernatural horror series']
    },
    'snakeeyes-supernatural': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=27,10765&sort_by=popularity.desc',
        fallbackQueries: ['supernatural horror shows', 'paranormal series', 'haunted tv shows']
    },
    'snakeeyes-horror': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_genres=27&sort_by=popularity.desc',
        fallbackQueries: ['horror movies', 'scary films', 'supernatural horror movies']
    }
};

function normalizeTitle(item) {
    return item.title || item.name || item.original_title || item.original_name || 'Unknown';
}

function normalizeOverview(item) {
    return item.overview || item.tagline || '';
}

function buildId(item) {
    if (!item || !item.id) return null;
    if (item.imdb_id && /^tt\d+$/.test(item.imdb_id)) return item.imdb_id;
    return `tmdb:${item.id}`;
}

function movieToMeta(item) {
    if (!item || !item.id) return null;
    return {
        id: buildId(item),
        type: 'movie',
        name: normalizeTitle(item),
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        description: normalizeOverview(item)
    };
}

function tvToMeta(item) {
    if (!item || !item.id) return null;
    return {
        id: buildId(item),
        type: 'series',
        name: normalizeTitle(item),
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        description: normalizeOverview(item)
    };
}

function dedupeMetas(items) {
    const map = new Map();
    for (const item of items || []) {
        if (!item || !item.id || !item.name || item.name === 'Unknown') continue;
        map.set(item.id, item);
    }
    return [...map.values()];
}

function extractTrailerUrl(detail) {
    const videos = detail && detail.videos && Array.isArray(detail.videos.results) ? detail.videos.results : [];
    if (!videos.length) return null;

    const trailer = videos.find(v => (v.type || '').toLowerCase() === 'trailer' && (v.site || '').toLowerCase() === 'youtube')
        || videos.find(v => (v.type || '').toLowerCase() === 'teaser' && (v.site || '').toLowerCase() === 'youtube')
        || videos.find(v => (v.site || '').toLowerCase() === 'youtube')
        || videos[0];

    if (!trailer || !trailer.key) return null;
    return `https://www.youtube.com/watch?v=${trailer.key}`;
}

function buildVideoList(detail, type) {
    const trailerUrl = extractTrailerUrl(detail);
    if (!trailerUrl) return [];

    const releaseDate = detail.release_date || detail.first_air_date || '';
    return [{
        id: 'trailer',
        title: 'Trailer',
        released: releaseDate,
        type: type === 'series' ? 'series' : 'movie',
        streams: [{
            url: trailerUrl,
            title: 'Trailer',
            behaviorHints: { bingeGroup: 'trailer' }
        }]
    }];
}

async function fetchTmdb(endpoint, params = {}) {
    const query = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
    const response = await fetch(`${TMDB_BASE}/${endpoint}?${query.toString()}`);
    if (!response.ok) {
        throw new Error(`TMDB ${endpoint} failed with ${response.status}`);
    }
    return response.json();
}

async function fetchMetas(catalogId, type) {
    const config = catalogConfig[catalogId];
    if (!config) return [];

    if (config.type === 'discover') {
        let results = [];
        try {
            const data = await fetchTmdb(config.endpoint);
            results = Array.isArray(data.results) ? data.results : [];
        } catch (err) {
            console.warn(`Discover fetch failed for ${catalogId}:`, err.message);
        }

        let metas = type === 'series' ? results.map(tvToMeta) : results.map(movieToMeta);
        let deduped = dedupeMetas(metas);
        if (deduped.length > 0) return deduped;

        if (Array.isArray(config.fallbackQueries) && config.fallbackQueries.length > 0) {
            const fallbackResults = [];
            const seen = new Set();
            for (const query of config.fallbackQueries) {
                try {
                    const endpoint = type === 'series' ? 'search/tv' : 'search/movie';
                    const data = await fetchTmdb(endpoint, { query, include_adult: false });
                    const items = Array.isArray(data.results) ? data.results : [];
                    for (const item of items) {
                        const meta = type === 'series' ? tvToMeta(item) : movieToMeta(item);
                        if (!meta || !meta.id || seen.has(meta.id)) continue;
                        seen.add(meta.id);
                        fallbackResults.push(meta);
                    }
                } catch (err) {
                    console.warn(`Fallback search failed for ${catalogId} query ${query}:`, err.message);
                }
            }
            return dedupeMetas(fallbackResults).slice(0, 20);
        }

        return [];
    }

    return [];
}

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
  <p>1980s, 1990s, 2000s movies, kids, documentaries, drama, comedy, horror, and supernatural horror.</p>
  <a class="btn" href="stremio://${host}/manifest.json">Install in Stremio</a>
  <div class="categories">
    <h3>What's Included:</h3>
    <ul>
      <li>📼 1980s Movies</li>
      <li>📼 1990s Movies</li>
      <li>📼 2000s Movies</li>
      <li>🧒 Kids Zone</li>
      <li>🎥 Documentaries</li>
      <li>🎭 Drama Series</li>
      <li>😂 Comedy Series</li>
      <li>👻 Horror Series</li>
      <li>🔮 Supernatural Horror Shows</li>
      <li>🔪 Horror Movies</li>
    </ul>
  </div>
</body>
</html>`);
});

app.get('/manifest.json', (req, res) => res.json(manifest));

app.get('/catalog/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    if (!TMDB_API_KEY) {
        console.error('TMDB_API_KEY not set');
        return res.json({ metas: [] });
    }

    try {
        const metas = await fetchMetas(id, type);
        res.json({ metas: metas.filter(m => m && m.name && m.name !== 'Unknown') });
    } catch (err) {
        console.error('Catalog error:', err.message);
        res.json({ metas: [] });
    }
});

app.get('/meta/:type/:id.json', async (req, res) => {
    const { type, id } = req.params;
    if (!TMDB_API_KEY) return res.json({ meta: {} });

    try {
        const mediaType = type === 'series' ? 'tv' : 'movie';
        let detail = null;

        if (id.startsWith('tmdb:')) {
            const tmdbId = id.replace('tmdb:', '');
            detail = await fetchTmdb(`${mediaType}/${tmdbId}`, { append_to_response: 'videos' });
        } else if (/^tt\d+$/.test(id)) {
            const findData = await fetchTmdb('find/' + id, { external_source: 'imdb_id' });
            let tmdbId = null;
            if (mediaType === 'movie' && Array.isArray(findData.movie_results) && findData.movie_results.length > 0) {
                tmdbId = findData.movie_results[0].id;
            } else if (mediaType === 'tv' && Array.isArray(findData.tv_results) && findData.tv_results.length > 0) {
                tmdbId = findData.tv_results[0].id;
            }
            if (tmdbId) {
                detail = await fetchTmdb(`${mediaType}/${tmdbId}`, { append_to_response: 'videos' });
            }
        }

        if (!detail || detail.success === false) return res.json({ meta: {} });

        const trailerUrl = extractTrailerUrl(detail);
        const meta = {
            id,
            type,
            name: normalizeTitle(detail),
            poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
            background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
            description: normalizeOverview(detail),
            releaseInfo: (detail.release_date || detail.first_air_date || '').split('-')[0],
            runtime: type === 'movie' && detail.runtime ? `${detail.runtime} min` : null,
            imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : null,
            trailer: trailerUrl,
            videos: buildVideoList(detail, type)
        };

        res.json({ meta });
    } catch (err) {
        console.error('Meta error:', err.message);
        res.json({ meta: {} });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', tmdb: TMDB_API_KEY ? 'set' : 'NOT SET' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Snakeeyes Catalog v3.6 running on port ${PORT}`);
    if (!TMDB_API_KEY) console.warn('WARNING: TMDB_API_KEY is not set');
});
