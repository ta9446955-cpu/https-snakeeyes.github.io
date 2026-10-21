// index.js
// Snakeeyes Stremio Catalog Addon — Node.js/Express for Render.com
// v3.14 — franchise-focused catalog: popular movies + Spider-Man, Avengers, Jurassic Park, Godzilla, Wrong Turn, Conjuring, Saw, Terminator, Toy Story, Minions, Moana, Candyman, Child's Play

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

const manifest = {
    id: 'community.snakeeyes.catalog',
    version: '3.14.0',
    name: 'Snakeeyes Catalog',
    description: 'Popular movies and big franchise collections including Spider-Man, Avengers, Jurassic Park, Godzilla, Wrong Turn, The Conjuring, Saw, Terminator, Toy Story, Minions, Moana, Candyman, and Child\'s Play.',
    logo: 'https://via.placeholder.com/150',
    resources: ['catalog', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: [
        { type: 'movie', id: 'snakeeyes-popular', name: '🎬 Popular Movies' },
        { type: 'movie', id: 'snakeeyes-spiderman', name: '🕷️ Spider-Man Collection' },
        { type: 'movie', id: 'snakeeyes-avengers', name: '🦸 Avengers Collection' },
        { type: 'movie', id: 'snakeeyes-jurassic', name: '🦖 Jurassic Park Collection' },
        { type: 'movie', id: 'snakeeyes-godzilla', name: '🐲 Godzilla Collection' },
        { type: 'movie', id: 'snakeeyes-wrongturn', name: '🩸 Wrong Turn Collection' },
        { type: 'movie', id: 'snakeeyes-conjuring', name: '👻 The Conjuring Collection' },
        { type: 'movie', id: 'snakeeyes-saw', name: '🔪 Saw Collection' },
        { type: 'movie', id: 'snakeeyes-terminator', name: '🤖 Terminator Collection' },
        { type: 'movie', id: 'snakeeyes-toystory', name: '🧸 Toy Story Collection' },
        { type: 'movie', id: 'snakeeyes-minions', name: '👀 Minions Collection' },
        { type: 'movie', id: 'snakeeyes-moana', name: '🌊 Moana Collection' },
        { type: 'movie', id: 'snakeeyes-candyman', name: '🩸 Candyman Collection' },
        { type: 'movie', id: 'snakeeyes-childsplay', name: '🤖 Child\'s Play Collection' },
        { type: 'movie', id: 'snakeeyes-horror', name: '👻 Horror Movies' },
        { type: 'series', id: 'snakeeyes-series', name: '📺 Popular Series' },
        { type: 'series', id: 'snakeeyes-drama', name: '🎭 Drama Series' },
        { type: 'series', id: 'snakeeyes-comedy', name: '😂 Comedy Series' },
        { type: 'series', id: 'snakeeyes-horror-tv', name: '👻 Horror Series' },
        { type: 'series', id: 'snakeeyes-supernatural', name: '🔮 Supernatural Horror Shows' },
        { type: 'movie', id: 'snakeeyes-lotr', name: '💍 Lord of the Rings' },
        { type: 'movie', id: 'snakeeyes-johnwick', name: '🐶 John Wick Collection' },
        { type: 'movie', id: 'snakeeyes-transformers', name: '🤖 Transformers Collection' },
        { type: 'movie', id: 'snakeeyes-xmen', name: '⚡ X-Men Collection' },
        { type: 'movie', id: 'snakeeyes-starwars', name: '⭐ Star Wars Collection' },
        { type: 'movie', id: 'snakeeyes-fastnfurious', name: '🚗 Fast & Furious Collection' },
        { type: 'movie', id: 'snakeeyes-superman', name: '🦸 Superman Films' },
        { type: 'movie', id: 'snakeeyes-batman', name: '🦇 Batman Films' }
    ]
};

const catalogConfig = {
    'snakeeyes-popular': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&sort_by=popularity.desc&release_date.gte=2015-01-01',
        fallbackQueries: ['popular movies 2024', 'latest blockbuster movies', 'most popular action movies']
    },
    'snakeeyes-spiderman': { type: 'search_movie', queries: ['Spider-Man', 'Spider-Man: Homecoming', 'Spider-Man: Far From Home', 'Spider-Man: No Way Home', 'The Amazing Spider-Man'] },
    'snakeeyes-avengers': { type: 'search_movie', queries: ['Avengers', 'Avengers: Endgame', 'Avengers: Infinity War', 'The Avengers', 'Captain America The First Avenger'] },
    'snakeeyes-jurassic': { type: 'search_movie', queries: ['Jurassic Park', 'Jurassic World', 'Jurassic World Dominion', 'The Lost World: Jurassic Park'] },
    'snakeeyes-godzilla': { type: 'search_movie', queries: ['Godzilla', 'Godzilla King of the Monsters', 'Godzilla vs Kong', 'Godzilla 1985'] },
    'snakeeyes-wrongturn': { type: 'search_movie', queries: ['Wrong Turn', 'Wrong Turn 2', 'Wrong Turn 3', 'Wrong Turn 4', 'Wrong Turn 5'] },
    'snakeeyes-conjuring': { type: 'search_movie', queries: ['The Conjuring', 'The Conjuring 2', 'The Conjuring: The Devil Made Me Do It', 'Annabelle', 'The Nun'] },
    'snakeeyes-saw': { type: 'search_movie', queries: ['Saw', 'Saw 2', 'Saw 3', 'Saw 4', 'Saw 5', 'Saw X'] },
    'snakeeyes-terminator': { type: 'search_movie', queries: ['The Terminator', 'Terminator 2: Judgment Day', 'Terminator 3', 'Terminator Genisys', 'Terminator: Dark Fate'] },
    'snakeeyes-toystory': { type: 'search_movie', queries: ['Toy Story', 'Toy Story 2', 'Toy Story 3', 'Toy Story 4', 'Toy Story 5'] },
    'snakeeyes-minions': { type: 'search_movie', queries: ['Minions', 'Despicable Me', 'Despicable Me 2', 'Despicable Me 3', 'Minions: The Rise of Gru'] },
    'snakeeyes-moana': { type: 'search_movie', queries: ['Moana', 'Moana 2', 'Encanto', 'Frozen', 'Tangled'] },
    'snakeeyes-candyman': { type: 'search_movie', queries: ['Candyman', 'Candyman 2', 'Candyman 3', 'Candyman: Day of the Dead', 'Candyman 2021'] },
    'snakeeyes-childsplay': { type: 'search_movie', queries: ['Child\'s Play', 'Child\'s Play 2', 'Child\'s Play 3', 'Bride of Chucky', 'Seed of Chucky'] },
    'snakeeyes-horror': {
        type: 'discover',
        endpoint: 'discover/movie?include_adult=false&with_genres=27&sort_by=popularity.desc&release_date.gte=2010-01-01',
        fallbackQueries: ['modern horror movies', 'popular horror films', 'scary movie collection']
    },
    'snakeeyes-series': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&sort_by=popularity.desc&first_air_date.gte=2010-01-01',
        fallbackQueries: ['popular American series 2024', 'best American tv shows 2020s', 'new series 2024']
    },
    'snakeeyes-drama': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=18&sort_by=popularity.desc&first_air_date.gte=2010-01-01',
        fallbackQueries: ['American drama series', 'best drama shows', 'award drama series']
    },
    'snakeeyes-comedy': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=35&sort_by=popularity.desc&first_air_date.gte=2010-01-01',
        fallbackQueries: ['American comedy series', 'funny shows 2020s', 'sitcoms']
    },
    'snakeeyes-horror-tv': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=27&sort_by=popularity.desc&first_air_date.gte=2010-01-01',
        fallbackQueries: ['American horror series', 'scary shows', 'haunted series']
    },
    'snakeeyes-supernatural': {
        type: 'discover',
        endpoint: 'discover/tv?include_adult=false&with_genres=27,10765&sort_by=popularity.desc&first_air_date.gte=2010-01-01',
        fallbackQueries: ['American supernatural horror shows', 'paranormal series', 'haunted shows']
    },
    'snakeeyes-lotr': { type: 'collection', collectionId: '119', fallbackQueries: ['The Lord of the Rings'] },
    'snakeeyes-johnwick': { type: 'collection', collectionId: '404609', fallbackQueries: ['John Wick'] },
    'snakeeyes-transformers': { type: 'collection', collectionId: '8650', fallbackQueries: ['Transformers'] },
    'snakeeyes-xmen': { type: 'collection', collectionId: '748', fallbackQueries: ['X-Men'] },
    'snakeeyes-starwars': { type: 'collection', collectionId: '10', fallbackQueries: ['Star Wars'] },
    'snakeeyes-fastnfurious': { type: 'collection', collectionId: '9485', fallbackQueries: ['Fast & Furious', 'The Fast and the Furious'] },
    'snakeeyes-superman': { type: 'collection', collectionId: '863151', fallbackQueries: ['Superman', 'Man of Steel', 'Superman Returns'] },
    'snakeeyes-batman': { type: 'collection', collectionId: '948485', fallbackQueries: ['Batman', 'The Dark Knight', 'Batman Begins'] }
};

function cleanTitleForUsOnly(item) {
    if (!item) return null;
    const title = item.title || item.name || item.original_title || item.original_name || '';
    if (!title || title === 'Unknown') return null;
    return item;
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
            return dedupeMetas(fallbackResults).slice(0, 25);
        }

        return [];
    }

    if (config.type === 'search_movie') {
        const results = [];
        const seen = new Set();

        for (const query of config.queries || []) {
            try {
                const data = await fetchTmdb('search/movie', { query, include_adult: false, region: 'US', language: 'en-US' });
                const items = Array.isArray(data.results) ? data.results : [];
                for (const item of items) {
                    if (!cleanTitleForUsOnly(item)) continue;
                    const meta = movieToMeta(item);
                    if (!meta || !meta.id || seen.has(meta.id)) continue;
                    seen.add(meta.id);
                    results.push(meta);
                }
            } catch (err) {
                console.warn(`Movie search failed for ${catalogId} query ${query}:`, err.message);
            }
        }
        return results.slice(0, 25);
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
            return dedupeMetas(mapped).slice(0, 25);
        }

        return [];
    }

    if (config.type === 'person_movies') {
        const data = await fetchTmdb(`person/${config.personId}/movie_credits`);
        const cast = Array.isArray(data.crew) ? data.crew : Array.isArray(data.cast) ? data.cast : [];
        cast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        const filtered = cast.filter(item => cleanTitleForUsOnly(item));
        const mapped = filtered.slice(0, 25).map(movieToMeta);
        return dedupeMetas(mapped);
    }

    if (config.type === 'person_tv') {
        const data = await fetchTmdb(`person/${config.personId}/tv_credits`);
        const cast = Array.isArray(data.cast) ? data.cast : [];
        cast.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        const filtered = cast.filter(item => cleanTitleForUsOnly(item));
        const mapped = filtered.slice(0, 25).map(tvToMeta);
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
        return results.slice(0, 25);
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
    .categories { margin-top: 40px; text-align: left; max-width: 980px; margin-left: auto; margin-right: auto; background: #2a2a2a; padding: 20px; border-radius: 10px; }
    ul { columns: 2; }
  </style>
</head>
<body>
  <h1>🐍 Snakeeyes Stremio Catalog</h1>
  <p>Popular movies and franchise collections for Spider-Man, Avengers, Jurassic Park, Godzilla, Wrong Turn, The Conjuring, Saw, Terminator, Toy Story, Minions, Moana, Candyman, and Child's Play.</p>
  <a class="btn" href="stremio://${host}/manifest.json">Install in Stremio</a>
  <div class="categories">
    <h3>What's Included:</h3>
    <ul>
      <li>🎬 Popular Movies</li>
      <li>🕷️ Spider-Man Collection</li>
      <li>🦸 Avengers Collection</li>
      <li>🦖 Jurassic Park Collection</li>
      <li>🐲 Godzilla Collection</li>
      <li>🩸 Wrong Turn Collection</li>
      <li>👻 The Conjuring Collection</li>
      <li>🔪 Saw Collection</li>
      <li>🤖 Terminator Collection</li>
      <li>🧸 Toy Story Collection</li>
      <li>👀 Minions Collection</li>
      <li>🌊 Moana Collection</li>
      <li>🩸 Candyman Collection</li>
      <li>🤖 Child's Play Collection</li>
      <li>👻 Horror Movies</li>
      <li>📺 Popular Series</li>
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
    console.log(`Snakeeyes Catalog v3.14 running on port ${PORT}`);
    if (!TMDB_API_KEY) console.warn('WARNING: TMDB_API_KEY is not set');
});
