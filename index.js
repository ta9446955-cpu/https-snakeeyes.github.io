// index.js
// Snakeeyes Stremio Catalog Addon — Node.js/Express for Render.com
// v5.1 — Fixed discover endpoints (no double-? bug)

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const THIS_YEAR = new Date().getFullYear();

const manifest = {
    id: 'community.snakeeyes.catalog',
    version: '5.1.0',
    name: 'Snakeeyes Catalog',
    description: 'Movies & TV — franchises, decades, genres, and trailers on every title.',
    logo: 'https://via.placeholder.com/150',
    resources: ['catalog', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'tmdb:'],
    catalogs: [
        // This Year
        { type: 'movie',  id: 'snakeeyes-popular-year',     name: '🔥 Popular Movies This Year' },
        { type: 'movie',  id: 'snakeeyes-horror-year',      name: '🔪 Horror This Year' },
        // General
        { type: 'movie',  id: 'snakeeyes-popular',          name: '🎬 Popular Movies (2020+)' },
        { type: 'movie',  id: 'snakeeyes-award',            name: '🏆 Award Winning Films' },
        { type: 'movie',  id: 'snakeeyes-kids',             name: '🧒 Kids Zone' },
        { type: 'movie',  id: 'snakeeyes-docs',             name: '🎥 Documentaries' },
        // Decades
        { type: 'movie',  id: 'snakeeyes-80s',              name: '📼 1980s Movies' },
        { type: 'movie',  id: 'snakeeyes-90s',              name: '📼 1990s Movies' },
        { type: 'movie',  id: 'snakeeyes-00s',              name: '📼 2000s Movies' },
        // TV Genres
        { type: 'series', id: 'snakeeyes-drama',            name: '🎭 Drama Series' },
        { type: 'series', id: 'snakeeyes-comedy',           name: '😂 Comedy Series' },
        { type: 'series', id: 'snakeeyes-horror-tv',        name: '👻 Horror Series' },
        { type: 'series', id: 'snakeeyes-supernatural',     name: '🔮 Supernatural Shows' },
        // Directors & Actors
        { type: 'movie',  id: 'snakeeyes-nolan',            name: '🎬 Christopher Nolan' },
        { type: 'movie',  id: 'snakeeyes-tarantino',        name: '🎬 Quentin Tarantino' },
        { type: 'movie',  id: 'snakeeyes-leo',              name: '🌟 Leonardo DiCaprio Films' },
        // Horror
        { type: 'movie',  id: 'snakeeyes-horror',           name: '👻 Popular Horror (2020+)' },
        { type: 'movie',  id: 'snakeeyes-insidious',        name: '👁️ Insidious Collection' },
        { type: 'movie',  id: 'snakeeyes-hellraiser',       name: '😈 Hellraiser Collection' },
        { type: 'movie',  id: 'snakeeyes-conjuring',        name: '👻 The Conjuring Collection' },
        { type: 'movie',  id: 'snakeeyes-saw',              name: '🔪 Saw Collection' },
        { type: 'movie',  id: 'snakeeyes-candyman',         name: '🩸 Candyman Collection' },
        { type: 'movie',  id: 'snakeeyes-childsplay',       name: "🤡 Child's Play Collection" },
        // Marvel / DC
        { type: 'movie',  id: 'snakeeyes-spiderman',        name: '🕷️ Spider-Man Collection' },
        { type: 'movie',  id: 'snakeeyes-avengers',         name: '🦸 Avengers Collection' },
        { type: 'movie',  id: 'snakeeyes-xmen',             name: '⚡ X-Men Collection' },
        { type: 'movie',  id: 'snakeeyes-superman',         name: '🦸 Superman Films' },
        { type: 'movie',  id: 'snakeeyes-supergirl',        name: '🦸‍♀️ Supergirl Films' },
        { type: 'movie',  id: 'snakeeyes-batman',           name: '🦇 Batman Films' },
        // Action Franchises
        { type: 'movie',  id: 'snakeeyes-lotr',             name: '💍 Lord of the Rings' },
        { type: 'movie',  id: 'snakeeyes-johnwick',         name: '🐶 John Wick Collection' },
        { type: 'movie',  id: 'snakeeyes-transformers',     name: '🤖 Transformers Collection' },
        { type: 'movie',  id: 'snakeeyes-starwars',         name: '⭐ Star Wars Collection' },
        { type: 'movie',  id: 'snakeeyes-fastnfurious',     name: '🚗 Fast & Furious Collection' },
        { type: 'movie',  id: 'snakeeyes-terminator',       name: '🤖 Terminator Collection' },
        // Sci-Fi / Adventure
        { type: 'movie',  id: 'snakeeyes-jurassic',         name: '🦖 Jurassic Park Collection' },
        { type: 'movie',  id: 'snakeeyes-godzilla',         name: '🐲 Godzilla Collection' },
        // Family / Animation
        { type: 'movie',  id: 'snakeeyes-toystory',         name: '🧸 Toy Story Collection' },
        { type: 'movie',  id: 'snakeeyes-minions',          name: '👀 Minions Collection' },
        { type: 'movie',  id: 'snakeeyes-moana',            name: '🌊 Moana Collection' },
        // Franchise TV
        { type: 'series', id: 'snakeeyes-starwars-tv',      name: '⭐ Star Wars TV Shows' },
        { type: 'series', id: 'snakeeyes-xmen-tv',          name: '⚡ X-Men Animated Series' },
        { type: 'series', id: 'snakeeyes-transformers-tv',  name: '🤖 Transformers Animated' },
        { type: 'series', id: 'snakeeyes-batman-tv',        name: '🦇 Batman TV Series' },
        { type: 'series', id: 'snakeeyes-superman-tv',      name: '🦸 Superman TV Series' }
    ]
};

// ── Catalog config ────────────────────────────────────────────────────────────
// For 'discover' type: path = just the path segment, params = query params object
// This avoids any double-? issue completely

const catalogConfig = {
    // This Year
    'snakeeyes-popular-year': { type: 'discover', path: 'discover/movie', params: { include_adult: false, sort_by: 'popularity.desc', 'release_date.gte': `${THIS_YEAR}-01-01` } },
    'snakeeyes-horror-year':  { type: 'discover', path: 'discover/movie', params: { include_adult: false, with_genres: 27, sort_by: 'popularity.desc', 'release_date.gte': `${THIS_YEAR}-01-01` } },
    // General
    'snakeeyes-popular': { type: 'discover', path: 'discover/movie', params: { include_adult: false, sort_by: 'popularity.desc', 'release_date.gte': '2020-01-01' } },
    'snakeeyes-award':   { type: 'discover', path: 'movie/top_rated', params: { language: 'en-US' } },
    'snakeeyes-kids':    { type: 'discover', path: 'discover/movie', params: { include_adult: false, certification_country: 'US', 'certification.lte': 'G', sort_by: 'popularity.desc' } },
    'snakeeyes-docs':    { type: 'discover', path: 'discover/movie', params: { include_adult: false, with_genres: 99, sort_by: 'popularity.desc' } },
    // Decades
    'snakeeyes-80s': { type: 'discover', path: 'discover/movie', params: { include_adult: false, 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '1989-12-31', sort_by: 'popularity.desc' } },
    'snakeeyes-90s': { type: 'discover', path: 'discover/movie', params: { include_adult: false, 'primary_release_date.gte': '1990-01-01', 'primary_release_date.lte': '1999-12-31', sort_by: 'popularity.desc' } },
    'snakeeyes-00s': { type: 'discover', path: 'discover/movie', params: { include_adult: false, 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31', sort_by: 'popularity.desc' } },
    // TV Genres
    'snakeeyes-drama':        { type: 'discover', path: 'discover/tv', params: { with_genres: 18,    sort_by: 'popularity.desc' }, isTv: true },
    'snakeeyes-comedy':       { type: 'discover', path: 'discover/tv', params: { with_genres: 35,    sort_by: 'popularity.desc' }, isTv: true },
    'snakeeyes-horror-tv':    { type: 'discover', path: 'discover/tv', params: { with_genres: 9648,  sort_by: 'popularity.desc' }, isTv: true },
    'snakeeyes-supernatural': { type: 'discover', path: 'discover/tv', params: { with_genres: 10765, sort_by: 'popularity.desc' }, isTv: true },
    // Directors
    'snakeeyes-nolan':     { type: 'person_movies', personId: '525' },
    'snakeeyes-tarantino': { type: 'person_movies', personId: '138' },
    'snakeeyes-leo':       { type: 'person_movies', personId: '6193' },
    // Horror discover
    'snakeeyes-horror': { type: 'discover', path: 'discover/movie', params: { include_adult: false, with_genres: 27, sort_by: 'popularity.desc', 'release_date.gte': '2020-01-01' } },
    // Collections
    'snakeeyes-insidious':    { type: 'collection', collectionId: '228446' },
    'snakeeyes-hellraiser':   { type: 'search_movie', queries: ['Hellraiser 1987', 'Hellbound: Hellraiser II', 'Hellraiser III: Hell on Earth', 'Hellraiser: Bloodline', 'Hellraiser: Inferno', 'Hellraiser: Hellseeker', 'Hellraiser: Deader', 'Hellraiser: Hellworld', 'Hellraiser: Revelations', 'Hellraiser: Judgment', 'Hellraiser 2022'] },
    'snakeeyes-lotr':         { type: 'collection', collectionId: '119' },
    'snakeeyes-johnwick':     { type: 'collection', collectionId: '404609' },
    'snakeeyes-transformers': { type: 'collection', collectionId: '8650' },
    'snakeeyes-xmen':         { type: 'collection', collectionId: '748' },
    'snakeeyes-starwars':     { type: 'collection', collectionId: '10' },
    'snakeeyes-fastnfurious': { type: 'collection', collectionId: '9485' },
    // Superman: classic Reeve collection (8537) + Man of Steel/DCEU (209131) + new DCU (1540907)
    'snakeeyes-superman':     { type: 'multi_collection', collectionIds: ['8537', '209131', '1540907'] },
    // Supergirl: 1984 film (id 10929) + 2026 film (search)
    'snakeeyes-supergirl':    { type: 'tmdb_ids', ids: ['10929'], extraSearch: 'Supergirl 2026' },
    'snakeeyes-batman':       { type: 'collection', collectionId: '948485' },
    'snakeeyes-terminator':   { type: 'collection', collectionId: '528' },
    'snakeeyes-jurassic':     { type: 'collection', collectionId: '328' },
    'snakeeyes-godzilla':     { type: 'collection', collectionId: '535313' },
    'snakeeyes-toystory':     { type: 'collection', collectionId: '10194' },
    'snakeeyes-minions':      { type: 'collection', collectionId: '86066' },
    'snakeeyes-moana':        { type: 'collection', collectionId: '1241984' },
    // Search-based movie franchises
    'snakeeyes-conjuring':  { type: 'collection', collectionId: '313086' },
    'snakeeyes-saw':        { type: 'search_movie', queries: ['Saw', 'Saw II', 'Saw III', 'Saw IV', 'Saw V', 'Saw VI', 'Saw 3D', 'Jigsaw', 'Spiral', 'Saw X'] },
    'snakeeyes-candyman':   { type: 'search_movie', queries: ['Candyman 1992', 'Candyman: Farewell to the Flesh', "Candyman: Day of the Dead", 'Candyman 2021'] },
    'snakeeyes-childsplay': { type: 'search_movie', queries: ["Child's Play", "Child's Play 2", "Child's Play 3", 'Bride of Chucky', 'Seed of Chucky', 'Curse of Chucky', 'Cult of Chucky', "Child's Play 2019"] },
    'snakeeyes-spiderman':  { type: 'search_movie', queries: ['Spider-Man 2002', 'Spider-Man 2', 'Spider-Man 3', 'The Amazing Spider-Man', 'The Amazing Spider-Man 2', 'Spider-Man: Homecoming', 'Spider-Man: Far From Home', 'Spider-Man: No Way Home'] },
    'snakeeyes-avengers':   { type: 'search_movie', queries: ['The Avengers 2012', 'Avengers: Age of Ultron', 'Avengers: Infinity War', 'Avengers: Endgame', 'Captain America: The First Avenger', 'Captain America: The Winter Soldier', 'Iron Man', 'Thor'] },
    // TV Franchises
    'snakeeyes-starwars-tv':     { type: 'search_tv', queries: ['The Mandalorian', 'Andor', 'Obi-Wan Kenobi', 'The Book of Boba Fett', 'Ahsoka', 'Star Wars The Clone Wars', 'Star Wars Rebels', 'The Acolyte'] },
    'snakeeyes-xmen-tv':         { type: 'search_tv', queries: ['X-Men The Animated Series', 'X-Men Evolution', 'Wolverine and the X-Men', "X-Men '97"] },
    'snakeeyes-transformers-tv': { type: 'search_tv', queries: ['Transformers Generation 1', 'Transformers Animated', 'Transformers Prime', 'Transformers Robots in Disguise', 'Transformers Cyberverse'] },
    'snakeeyes-batman-tv':       { type: 'search_tv', queries: ['Batman The Animated Series', 'The Batman', 'Batman Beyond', 'Gotham', 'Batwoman', 'Batman Caped Crusader'] },
    'snakeeyes-superman-tv':     { type: 'search_tv', queries: ['Superman The Animated Series', 'Smallville', 'Superman and Lois', 'My Adventures with Superman'] }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        name: item.title || item.name || item.original_title || '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        description: item.overview || ''
    };
}

function tvToMeta(item) {
    if (!item || !item.id) return null;
    return {
        id: buildId(item),
        type: 'series',
        name: item.name || item.title || item.original_name || '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
        description: item.overview || ''
    };
}

function dedupe(metas) {
    const seen = new Map();
    for (const m of metas || []) {
        if (!m || !m.id || !m.name) continue;
        if (!seen.has(m.id)) seen.set(m.id, m);
    }
    return [...seen.values()];
}

function extractTrailerUrl(detail) {
    const videos = detail?.videos?.results || [];
    const pick = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official)
        || videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')
        || videos.find(v => v.type === 'Teaser'  && v.site === 'YouTube')
        || videos.find(v => v.site === 'YouTube');
    return pick ? `https://www.youtube.com/watch?v=${pick.key}` : null;
}

function buildVideoList(detail) {
    const url = extractTrailerUrl(detail);
    if (!url) return [];
    return [{
        id: 'trailer',
        title: 'Trailer',
        released: detail.release_date || detail.first_air_date || '',
        type: 'movie',
        streams: [{ url, title: 'Trailer', behaviorHints: { bingeGroup: 'trailer' } }]
    }];
}

// Core fetch — path and params are always separate so no double-? ever
async function fetchTmdb(path, params = {}) {
    const q = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
    const url = `${TMDB_BASE}/${path}?${q.toString()}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`TMDB ${path} → ${r.status}`);
    return r.json();
}

// ── Catalog fetcher ───────────────────────────────────────────────────────────

async function fetchMetas(catalogId) {
    const config = catalogConfig[catalogId];
    if (!config) return [];

    if (config.type === 'discover') {
        const data = await fetchTmdb(config.path, config.params || {});
        const results = data.results || [];
        return dedupe(config.isTv ? results.map(tvToMeta) : results.map(movieToMeta));
    }

    if (config.type === 'collection') {
        const data = await fetchTmdb(`collection/${config.collectionId}`);
        const parts = (data.parts || [])
            .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
        return dedupe(parts.map(movieToMeta));
    }

    if (config.type === 'person_movies') {
        const data = await fetchTmdb(`person/${config.personId}/movie_credits`);
        const crew = (data.crew || []).filter(m => m.job === 'Director');
        const list = crew.length > 0 ? crew : (data.cast || []);
        list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        return dedupe(list.slice(0, 20).map(movieToMeta));
    }

    if (config.type === 'search_movie') {
        const results = [];
        const seen = new Set();
        for (const query of config.queries || []) {
            const data = await fetchTmdb('search/movie', { query, include_adult: false, language: 'en-US' });
            for (const item of data.results || []) {
                const meta = movieToMeta(item);
                if (!meta || !meta.id || seen.has(meta.id)) continue;
                seen.add(meta.id);
                results.push(meta);
            }
        }
        return dedupe(results).slice(0, 30);
    }

    if (config.type === 'multi_collection') {
        const all = [];
        const seen = new Set();
        for (const cid of config.collectionIds || []) {
            try {
                const data = await fetchTmdb(`collection/${cid}`);
                const parts = (data.parts || []).sort((a, b) =>
                    (a.release_date || '').localeCompare(b.release_date || ''));
                for (const item of parts) {
                    const meta = movieToMeta(item);
                    if (!meta || !meta.id || seen.has(meta.id)) continue;
                    seen.add(meta.id);
                    all.push(meta);
                }
            } catch (e) { console.warn(`multi_collection ${cid} failed:`, e.message); }
        }
        return all;
    }

    if (config.type === 'tmdb_ids') {
        const results = [];
        const seen = new Set();
        for (const tmdbId of config.ids || []) {
            try {
                const data = await fetchTmdb(`movie/${tmdbId}`);
                const meta = movieToMeta(data);
                if (meta && meta.id && !seen.has(meta.id)) {
                    seen.add(meta.id);
                    results.push(meta);
                }
            } catch (e) { console.warn(`tmdb_ids ${tmdbId} failed:`, e.message); }
        }
        if (config.extraSearch) {
            try {
                const data = await fetchTmdb('search/movie', { query: config.extraSearch, include_adult: false });
                const item = (data.results || [])[0];
                if (item) {
                    const meta = movieToMeta(item);
                    if (meta && meta.id && !seen.has(meta.id)) results.push(meta);
                }
            } catch (e) { console.warn(`tmdb_ids extraSearch failed:`, e.message); }
        }
        return results;
    }

    if (config.type === 'search_tv') {
        const results = [];
        for (const query of config.queries || []) {
            const data = await fetchTmdb('search/tv', { query, include_adult: false, language: 'en-US' });
            if (data.results?.length > 0) results.push(tvToMeta(data.results[0]));
        }
        return dedupe(results);
    }

    return [];
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    const host = req.get('host');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snakeeyes Stremio Catalog</title>
  <style>
    body{font-family:Arial,sans-serif;background:#1a1a1a;color:white;text-align:center;padding:50px}
    h1{color:#7b5cff}
    .btn{background:#7b5cff;color:white;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:1.2em;display:inline-block;margin-top:20px}
    .btn:hover{background:#6245e0}
    .cats{margin-top:40px;text-align:left;max-width:700px;margin:40px auto 0;background:#2a2a2a;padding:20px;border-radius:10px}
    ul{columns:2}
  </style>
</head>
<body>
  <h1>🐍 Snakeeyes Stremio Catalog</h1>
  <p>Movies & TV — franchises, decades, genres, trailers on every title.</p>
  <a class="btn" href="stremio://${host}/manifest.json">Install in Stremio</a>
  <div class="cats"><h3>Included:</h3><ul>
    <li>🔥 Popular This Year</li><li>🔪 Horror This Year</li>
    <li>🎬 Popular 2020+</li><li>🏆 Award Films</li>
    <li>🧒 Kids Zone</li><li>🎥 Documentaries</li>
    <li>📼 80s / 90s / 2000s</li><li>🎭 Drama / Comedy TV</li>
    <li>🕷️ Spider-Man</li><li>🦸 Avengers</li>
    <li>⚡ X-Men</li><li>🦸 Superman / Batman</li>
    <li>⭐ Star Wars</li><li>💍 Lord of the Rings</li>
    <li>🐶 John Wick</li><li>🚗 Fast & Furious</li>
    <li>🤖 Transformers</li><li>🦖 Jurassic Park</li>
    <li>🐲 Godzilla</li><li>🧸 Toy Story / Minions</li>
    <li>👁️ Insidious</li><li>😈 Hellraiser</li>
    <li>👻 Conjuring</li><li>🔪 Saw</li>
    <li>🩸 Candyman</li><li>🤡 Child's Play</li>
    <li>🎬 Trailers on every title!</li>
  </ul></div>
</body>
</html>`);
});

app.get('/manifest.json', (req, res) => res.json(manifest));

app.get('/catalog/:type/:id.json', async (req, res) => {
    const { id } = req.params;
    if (!TMDB_API_KEY) return res.json({ metas: [] });
    try {
        const metas = await fetchMetas(id);
        res.json({ metas: metas.filter(m => m && m.name) });
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
            detail = await fetchTmdb(`${mediaType}/${id.replace('tmdb:', '')}`, { append_to_response: 'videos' });
        } else if (/^tt\d+$/.test(id)) {
            const found = await fetchTmdb(`find/${id}`, { external_source: 'imdb_id' });
            const hit = mediaType === 'movie' ? found.movie_results?.[0] : found.tv_results?.[0];
            if (hit) detail = await fetchTmdb(`${mediaType}/${hit.id}`, { append_to_response: 'videos' });
        }

        if (!detail || detail.success === false) return res.json({ meta: {} });

        const trailerUrl = extractTrailerUrl(detail);
        res.json({
            meta: {
                id, type,
                name: detail.title || detail.name || '',
                poster: detail.poster_path   ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
                description: detail.overview || '',
                releaseInfo: (detail.release_date || detail.first_air_date || '').split('-')[0],
                runtime: type === 'movie' && detail.runtime ? `${detail.runtime} min` : null,
                imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : null,
                trailer: trailerUrl,
                videos: buildVideoList(detail)
            }
        });
    } catch (err) {
        console.error('Meta error:', err.message);
        res.json({ meta: {} });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '5.1.0', tmdb: TMDB_API_KEY ? 'set' : 'NOT SET' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Snakeeyes Catalog v5.1 running on port ${PORT}`);
    if (!TMDB_API_KEY) console.warn('WARNING: TMDB_API_KEY is not set');
});
