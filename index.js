// index.js
// Snakeeyes Stremio Catalog Addon — Node.js/Express for Render.com
// v3.11 — recent US/English catalog only: 2010 onward, no old John Wayne / non-US baggage

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

const manifest = {
    id: 'community.snakeeyes.catalog',
    version: '3.11.0',
    name: 'Snakeeyes Catalog',
    description: 'Recent American Movies, TV Shows, Kids, Horror, Drama, Comedy, Documentaries, and Franchises.',
    logo: 'https://via.placeholder.com/150',
    resources: ['catalog', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: [
        { type: 'movie', id: 'snakeeyes-popular', name: '🔥 Popular Movies' },
        { type: 'movie', id: 'snakeeyes-award', name: '🏆 Award Winning Films' },
        { type: 'movie', id: 'snakeeyes-kids', name: '🧒 Kids Zone' },
        { type: 'movie', id: 'snakeeyes-docs', name: '🎥 Documentaries' },
        { type: 'movie', id: 'snakeeyes-80s', name: '📼 2010s Movies' },
        { type: 'movie', id: 'snakeeyes-90s', name: '📼 2020s Movies' },
        { type: 'movie', id: 'snakeeyes-00s', name: '📼 Recent Hits' },
        { type: 'series', id: 'snakeeyes-drama', name: '🎭 Drama Series' },
        { type: 'series', id: 'snakeeyes-comedy', name: '😂 Comedy Series' },
        { type: 'series', id: 'snakeeyes-horror-tv', name: '👻 Horror Series' },
        { type: 'series', id: 'snakeeyes-supernatural', name: '🔮 Supernatural Horror Shows' },
        { type: 'movie', id: 'snakeeyes-nolan', name: '🎬 Christopher Nolan Collection' },
        { type: 'movie', id: 'snakeeyes-tarantino', name: '🎬 Quentin Tarantino Collection' },
        { type: 'movie', id: 'snakeeyes-leo', name: '🌟 Leonardo DiCaprio Films' },
        { type: 'movie', id: 'snakeeyes-horror', name: '🔪 Horror Movies' },
        { type: 'movie', id: 'snakeeyes-insidious', name: '👁️ Insidious Collection' },
        { type: 'movie', id: 'snakeeyes-hellraiser', name: '😈 Hellraiser Collection' },
        { type: 'movie', id: 'snakeeyes-halloween', name: '🎃 Halloween Collection' },
        { type: 'movie', id: 'snakeeyes-predators', name: '🦷 Predator Collection' },
        { type: 'movie', id: 'snakeeyes-friday13', name: '🗡️ Friday the 13th Collection' },
        { type: 'movie', id: 'snakeeyes-nightmare', name: '😱 Nightmare on Elm Street Collection' },
        { type: 'movie', id: 'snakeeyes-lotr', name: '💍 Lord of the Rings' },
        { type: 'movie', id: 'snakeeyes-johnwick', name: '🐶 John Wick Collection' },
        { type: 'movie', id: 'snakeeyes-transformers', name: '🤖 Transformers Collection' },
        { type: 'movie', id: 'snakeeyes-xmen', name: '⚡ X-Men Collection' },
        { type: 'movie', id: 'snakeeyes-starwars', name: '⭐ Star Wars Collection' },
        { type: 'movie', id: 'snakeeyes-fastnfurious', name: '🚗 Fast & Furious Collection' },
        { type: 'movie', id: 'snakeeyes-superman', name: '🦸 Superman Films' },
        { type: 'movie', id: 'snakeeyes-batman', name: '🦇 Batman Films' },
        { type: 'series', id: 'snakeeyes-starwars-tv', name: '⭐ Star Wars TV Shows' },
        { type: 'series', id: 'snakeeyes-xmen-tv', name: '⚡ X-Men Animated Series' },
        { type: 'series', id: 'snakeeyes-transformers-tv', name: '🤖 Transformers Animated' },
        { type: 'series', id: 'snakeeyes-batman-tv', name: '🦇 Batman TV Series' },
        { type: 'series', id: 'snakeeyes-superman-tv', name: '🦸 Superman TV Series' }
    ]
};

const catalogConfig = {
    'snakeeyes-popular': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_original_language=en&region=US&release_date.gte=2010-01-01&sort_by=popularity.desc',
        fallbackQueries: ['American movies 2010s', 'popular American films 2020s']
    },
    'snakeeyes-award': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_original_language=en&region=US&release_date.gte=2010-01-01&sort_by=vote_average.desc&vote_count.gte=100',
        fallbackQueries: ['award winning American movies 2010s', 'best modern American films']
    },
    'snakeeyes-kids': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&certification_country=US&certification.lte=G&with_original_language=en&region=US&with_genres=16,10751&release_date.gte=2010-01-01&sort_by=popularity.desc',
        fallbackQueries: ['Disney movies 2010s', 'American family movies 2020s', 'kids movies 2020s']
    },
    'snakeeyes-docs': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_original_language=en&region=US&with_genres=99&release_date.gte=2010-01-01&sort_by=popularity.desc',
        fallbackQueries: ['American documentary films 2010s', 'history documentary 2020s', 'nature documentary 2020s']
    },
    'snakeeyes-80s': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_original_language=en&region=US&primary_release_date.gte=2010-01-01&primary_release_date.lte=2019-12-31&sort_by=popularity.desc',
        fallbackQueries: ['American 2010s movies', 'popular 2010s American films', '2010s action movies']
    },
    'snakeeyes-90s': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_original_language=en&region=US&primary_release_date.gte=2020-01-01&primary_release_date.lte=2029-12-31&sort_by=popularity.desc',
        fallbackQueries: ['American 2020s movies', 'popular 2020s American films', '2020s family movies']
    },
    'snakeeyes-00s': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_original_language=en&region=US&primary_release_date.gte=2010-01-01&sort_by=popularity.desc',
        fallbackQueries: ['American recent movies', 'modern American films', 'popular American action movies']
    },
    'snakeeyes-drama': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_original_language=en&first_air_date.gte=2010-01-01&sort_by=popularity.desc&with_genres=18',
        fallbackQueries: ['American drama series 2010s', 'best American drama shows 2020s', 'award drama series 2020s']
    },
    'snakeeyes-comedy': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_original_language=en&first_air_date.gte=2010-01-01&sort_by=popularity.desc&with_genres=35',
        fallbackQueries: ['American comedy series 2010s', 'funny American shows 2020s', 'sitcoms 2020s']
    },
    'snakeeyes-horror-tv': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_original_language=en&first_air_date.gte=2010-01-01&sort_by=popularity.desc&with_genres=27',
        fallbackQueries: ['American horror series 2010s', 'American scary shows 2020s', 'American supernatural horror series 2020s']
    },
    'snakeeyes-supernatural': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_original_language=en&first_air_date.gte=2010-01-01&sort_by=popularity.desc&with_genres=27,10765',
        fallbackQueries: ['American supernatural horror shows 2010s', 'American paranormal series 2020s', 'American haunted shows 2020s']
    },
    'snakeeyes-nolan': { type: 'person_movies', personId: '525' },
    'snakeeyes-tarantino': { type: 'person_movies', personId: '138' },
    'snakeeyes-leo': { type: 'person_movies', personId: '6193' },
    'snakeeyes-horror': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_original_language=en&region=US&with_genres=27&release_date.gte=2010-01-01&sort_by=popularity.desc',
        fallbackQueries: ['American horror movies 2010s', 'American scary movies 2020s', 'supernatural horror movies 2020s']
    },
    'snakeeyes-insidious': { type: 'collection', collectionId: '228446', fallbackQueries: ['Insidious'] },
    'snakeeyes-hellraiser': { type: 'collection', collectionId: '8916', fallbackQueries: ['Hellraiser'] },
    'snakeeyes-halloween': { type: 'collection', collectionId: '1262', fallbackQueries: ['Halloween', 'Halloween Kills', 'Halloween Ends'] },
    'snakeeyes-predators': { type: 'collection', collectionId: '399', fallbackQueries: ['Predator', 'Predators'] },
    'snakeeyes-friday13': { type: 'collection', collectionId: '9735', fallbackQueries: ['Friday the 13th', 'Friday the 13th Part 2'] },
    'snakeeyes-nightmare': { type: 'collection', collectionId: '8581', fallbackQueries: ['Nightmare on Elm Street', 'A Nightmare on Elm Street'] },
    'snakeeyes-lotr': { type: 'collection', collectionId: '119', fallbackQueries: ['The Lord of the Rings'] },
    'snakeeyes-johnwick': { type: 'collection', collectionId: '404609', fallbackQueries: ['John Wick'] },
    'snakeeyes-transformers': { type: 'collection', collectionId: '8650', fallbackQueries: ['Transformers'] },
    'snakeeyes-xmen': { type: 'collection', collectionId: '748', fallbackQueries: ['X-Men'] },
    'snakeeyes-starwars': { type: 'collection', collectionId: '10', fallbackQueries: ['Star Wars'] },
    'snakeeyes-fastnfurious': { type: 'collection', collectionId: '9485', fallbackQueries: ['Fast & Furious', 'The Fast and the Furious'] },
    'snakeeyes-superman': { type: 'collection', collectionId: '863151', fallbackQueries: ['Superman', 'Man of Steel', 'Superman Returns'] },
    'snakeeyes-batman': { type: 'collection', collectionId: '948485', fallbackQueries: ['Batman', 'The Dark Knight', 'Batman Begins'] },
    'snakeeyes-starwars-tv': { type: 'search_tv', queries: ['The Mandalorian', 'Andor', 'Obi-Wan Kenobi', 'The Book of Boba Fett', 'Ahsoka', 'Star Wars The Clone Wars', 'Star Wars Rebels', 'The Bad Batch'] },
    'snakeeyes-xmen-tv': { type: 'search_tv', queries: ['X-Men The Animated Series', 'X-Men Evolution', 'Wolverine and the X-Men', 'X-Men 97'] },
    'snakeeyes-transformers-tv': { type: 'search_tv', queries: ['Transformers Generation 1', 'Transformers Animated', 'Transformers Prime', 'Transformers Robots in Disguise', 'Transformers Cyberverse'] },
    'snakeeyes-batman-tv': { type: 'search_tv', queries: ['Batman The Animated Series', 'The Batman', 'Batman Beyond', 'Gotham', 'Batwoman', 'Batman Caped Crusader'] },
    'snakeeyes-superman-tv': { type: 'search_tv', queries: ['Superman The Animated Series', 'Smallville', 'Superman and Lois', 'My Adventures with Superman'] }
};

function cleanTitleForUsOnly(item) {
    if (!item) return null;
    const title = item.title || item.name || item.original_title || item.original_name || '';
    const originalLang = (item.original_language || '').toLowerCase();
    const originCountry = Array.isArray(item.origin_country) ? item.origin_country.map(c => (c || '').toUpperCase()) : [];
    const hasUsOrigin = originCountry.includes('US');
    const isEnglish = originalLang === 'en';
    if (!title || title === 'Unknown') return null;
    if (isEnglish || hasUsOrigin) return item;
    return null;
}

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

        const filtered = results.filter(item => cleanTitleForUsOnly(item));
        let metas = type === 'series' ? filtered.map(tvToMeta) : filtered.map(movieToMeta);
        let deduped = dedupeMetas(metas);
        if (deduped.length > 0) return deduped;

        if (Array.isArray(config.fallbackQueries) && config.fallbackQueries.length > 0) {
            const fallbackResults = [];
            const seen = new Set();
            for (const query of config.fallbackQueries) {
                try {
                    const endpoint = type === 'series' ? 'search/tv' : 'search/movie';
                    const data = await fetchTmdb(endpoint, { query, include_adult: false, region: 'US', language: 'en-US' });
                    const items = Array.isArray(data.results) ? data.results : [];
                    for (const item of items) {
                        const isUsRelevant = cleanTitleForUsOnly(item);
                        if (!isUsRelevant) continue;
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

    if (config.type === 'collection') {
        try {
            const data = await fetchTmdb(`collection/${config.collectionId}`);
            const parts = Array.isArray(data.parts) ? data.parts : [];
            const filtered = parts.filter(item => cleanTitleForUsOnly(item));
            const mapped = filtered.map(movieToMeta);
            const deduped = dedupeMetas(mapped);
            if (deduped.length > 0) return deduped;
        } catch (err) {
            console.warn(`Collection ${catalogId} lookup failed:`, err.message);
        }

        if (Array.isArray(config.fallbackQueries) && config.fallbackQueries.length > 0) {
            const queryResults = [];
            for (const query of config.fallbackQueries) {
                try {
                    const data = await fetchTmdb('search/movie', { query, include_adult: false, region: 'US', language: 'en-US' });
                    const items = Array.isArray(data.results) ? data.results : [];
                    for (const item of items) {
                        if (!cleanTitleForUsOnly(item)) continue;
                        queryResults.push(item);
                    }
                } catch (err) {
                    console.warn(`Fallback movie search failed for ${catalogId}:`, err.message);
                }
            }
            const mapped = queryResults.map(movieToMeta);
            return dedupeMetas(mapped).slice(0, 20);
        }

        return [];
    }

    if (config.type === 'person_movies') {
        const data = await fetchTmdb(`person/${config.personId}/movie_credits`);
        const cast = Array.isArray(data.crew) ? data.crew : Array.isArray(data.cast) ? data.cast : [];
        cast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        const filtered = cast.filter(item => cleanTitleForUsOnly(item));
        const mapped = filtered.slice(0, 20).map(movieToMeta);
        return dedupeMetas(mapped);
    }

    if (config.type === 'person_tv') {
        const data = await fetchTmdb(`person/${config.personId}/tv_credits`);
        const cast = Array.isArray(data.cast) ? data.cast : [];
        cast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        const filtered = cast.filter(item => cleanTitleForUsOnly(item));
        const mapped = filtered.slice(0, 20).map(tvToMeta);
        return dedupeMetas(mapped);
    }

    if (config.type === 'search_tv') {
        const results = [];
        const seen = new Set();

        for (const query of config.queries || []) {
            try {
                const data = await fetchTmdb('search/tv', { query, include_adult: false, region: 'US', language: 'en-US' });
                const items = Array.isArray(data.results) ? data.results : [];
                for (const item of items) {
                    if (!cleanTitleForUsOnly(item)) continue;
                    const meta = tvToMeta(item);
                    if (!meta || !meta.id || seen.has(meta.id)) continue;
                    seen.add(meta.id);
                    results.push(meta);
                }
            } catch (err) {
                console.warn(`TV search failed for ${catalogId} query ${query}:`, err.message);
            }
        }
        return results.slice(0, 20);
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
  <p>Recent American 2010s-2020s movies, kids, horror, drama, comedy, documentaries, and franchise picks.</p>
  <a class="btn" href="stremio://${host}/manifest.json">Install in Stremio</a>
  <div class="categories">
    <h3>What's Included:</h3>
    <ul>
      <li>🔥 Popular & Award Films</li>
      <li>🧒 Kids Zone</li>
      <li>🎥 Documentaries</li>
      <li>📼 2010s, 2020s Movies</li>
      <li>🎭 Drama Series</li>
      <li>😂 Comedy Series</li>
      <li>👻 Horror Series</li>
      <li>🔮 Supernatural Horror Shows</li>
      <li>🔪 Horror Movies</li>
      <li>👁️ Insidious Collection</li>
      <li>😈 Hellraiser Collection</li>
      <li>🎃 Halloween Collection</li>
      <li>🦷 Predator Collection</li>
      <li>🗡️ Friday the 13th Collection</li>
      <li>😱 Nightmare on Elm Street Collection</li>
      <li>💍 Lord of the Rings</li>
      <li>🐶 John Wick Collection</li>
      <li>🤖 Transformers Collection</li>
      <li>⚡ X-Men Collection</li>
      <li>⭐ Star Wars Collection</li>
      <li>🚗 Fast & Furious Collection</li>
      <li>🦸 Superman Films</li>
      <li>🦇 Batman Films</li>
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
    console.log(`Snakeeyes Catalog v3.11 running on port ${PORT}`);
    if (!TMDB_API_KEY) console.warn('WARNING: TMDB_API_KEY is not set');
});
