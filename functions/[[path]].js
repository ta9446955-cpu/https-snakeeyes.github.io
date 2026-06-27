// functions/[[path]].js

9e14731cf09b714603421a3f173df8fb
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

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Let Cloudflare Pages serve your static landing page (index.html)
    if (path === '/' || path === '/index.html' || path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.png')) {
        return env.ASSETS.fetch(request);
    }

    // Standard CORS headers for Stremio
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    };

    // 2. Handle Manifest Request
    if (path === "/manifest.json") {
        return new Response(JSON.stringify(manifest), { headers });
    }

    // 3. Handle Catalog Requests (e.g., /catalog/movie/snakeeyes-popular.json)
    const catalogMatch = path.match(/^\/catalog\/(movie|series)\/([a-zA-Z0-9_-]+)(?:\/skip=[0-9]+)?\.json$/);
    if (catalogMatch) {
        const type = catalogMatch[1];
        const id = catalogMatch[2];
        const tmdbEndpoint = catalogMap[id];
        
        if (!tmdbEndpoint) return new Response(JSON.stringify({ metas: [] }), { headers });

        try {
            const tmdbUrl = `https://api.themoviedb.org/3/${tmdbEndpoint}?api_key=${TMDB_API_KEY}`;
            const response = await fetch(tmdbUrl);
            const data = await response.json();

            const metas = data.results.map(item => ({
                id: `tt${item.imdb_id || item.id}`, 
                type: type,
                name: item.title || item.name,
                poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
                background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
                description: item.overview
            }));

            return new Response(JSON.stringify({ metas }), { headers });
        } catch (error) {
            return new Response(JSON.stringify({ metas: [] }), { headers });
        }
    }

    // 4. Handle Meta Requests (When a user clicks a poster to see details)
    const metaMatch = path.match(/^\/meta\/(movie|series)\/(tt[0-9]+)\.json$/);
    if (metaMatch) {
        const type = metaMatch[1];
        const imdbId = metaMatch[2];
        
        try {
            const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
            const findRes = await fetch(findUrl);
            const findData = await findRes.json();
            
            let tmdbId = null;
            if (type === 'movie' && findData.movie_results && findData.movie_results.length > 0) {
                tmdbId = findData.movie_results[0].id;
            } else if (type === 'series' && findData.tv_results && findData.tv_results.length > 0) {
                tmdbId = findData.tv_results[0].id;
            }

            if (!tmdbId) return new Response(JSON.stringify({ meta: {} }), { headers });

            const detailUrl = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}?api_key=${TMDB_API_KEY}`;
            const detailRes = await fetch(detailUrl);
            const detail = await detailRes.json();

            const meta = {
                id: imdbId,
                type: type,
                name: detail.title || detail.name,
                poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
                description: detail.overview,
                releaseInfo: (detail.release_date || detail.first_air_date || "").split("-")[0],
                runtime: type === 'movie' && detail.runtime ? `${detail.runtime} min` : null,
                imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : null
            };

            return new Response(JSON.stringify({ meta }), { headers });
        } catch (error) {
            return new Response(JSON.stringify({ meta: {} }), { headers });
        }
    }

    // Fallback
    return new Response("Snakeeyes Addon is running!", { headers: { "Access-Control-Allow-Origin": "*" } });
         }
