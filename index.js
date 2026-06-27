// src/index.js
// Snakeeyes Stremio Catalog Addon — Cloudflare Workers format

const manifest = {
    id: "community.snakeeyes.catalog",
    version: "1.0.0",
    name: "Snakeeyes Catalog",
    description: "Custom catalogs for Movies, TV Shows, Directors, and Decades.",
    logo: "https://via.placeholder.com/150",
    resources: ["catalog", "meta"],
    types: ["movie", "series"],
    idPrefixes: ["tmdb"], // CHANGED: was ["tt"] — we are NOT issuing real IMDb ids
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

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "application/json"
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight requests (Stremio clients sometimes send these)
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "*"
                }
            });
        }

        // 1. Let static assets (index.html, css, js, images) serve normally.
        if (
            path === "/" ||
            path === "/index.html" ||
            path.endsWith(".css") ||
            path.endsWith(".js") ||
            path.endsWith(".png") ||
            path.endsWith(".ico") ||
            path.endsWith(".svg")
        ) {
            return env.ASSETS.fetch(request);
        }

        // 2. Manifest
        if (path === "/manifest.json") {
            return new Response(JSON.stringify(manifest), { headers: CORS_HEADERS });
        }

        // 3. Catalog requests, e.g. /catalog/movie/snakeeyes-popular.json
        const catalogMatch = path.match(/^\/catalog\/(movie|series)\/([a-zA-Z0-9_-]+)(?:\/skip=[0-9]+)?\.json$/);
        if (catalogMatch) {
            const type = catalogMatch[1];
            const id = catalogMatch[2];
            const tmdbEndpoint = catalogMap[id];

            if (!tmdbEndpoint) {
                return new Response(JSON.stringify({ metas: [] }), { headers: CORS_HEADERS });
            }

            const tmdbApiKey = env.TMDB_API_KEY;
            if (!tmdbApiKey) {
                console.error("TMDB_API_KEY is not set in environment variables");
                return new Response(JSON.stringify({ metas: [] }), { headers: CORS_HEADERS });
            }

            try {
                const separator = tmdbEndpoint.includes("?") ? "&" : "?";
                const tmdbUrl = `https://api.themoviedb.org/3/${tmdbEndpoint}${separator}api_key=${tmdbApiKey}`;
                const response = await fetch(tmdbUrl);

                if (!response.ok) {
                    console.error(`TMDB request failed: ${response.status} ${response.statusText}`);
                    return new Response(JSON.stringify({ metas: [] }), { headers: CORS_HEADERS });
                }

                const data = await response.json();
                const results = data.results || [];

                // CHANGED: use the TMDB numeric id directly, prefixed with "tmdb:" —
                // we never had real IMDb ids here (discover/popular/top_rated never
                // return imdb_id), so stop pretending we did.
                const metas = results
                    .filter(item => item.id)
                    .map(item => ({
                        id: `tmdb:${item.id}`,
                        type: type,
                        name: item.title || item.name,
                        poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
                        background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
                        description: item.overview
                    }));

                return new Response(JSON.stringify({ metas }), { headers: CORS_HEADERS });
            } catch (error) {
                console.error("Catalog fetch error:", error.message);
                return new Response(JSON.stringify({ metas: [] }), { headers: CORS_HEADERS });
            }
        }

        // 4. Meta requests, e.g. /meta/movie/tmdb:680.json
        // CHANGED: match "tmdb:<digits>" instead of "tt<digits>", since that's
        // the id scheme we now issue from the catalog handler above.
        const metaMatch = path.match(/^\/meta\/(movie|series)\/tmdb:([0-9]+)\.json$/);
        if (metaMatch) {
            const type = metaMatch[1];
            const tmdbId = metaMatch[2];

            const tmdbApiKey = env.TMDB_API_KEY;
            if (!tmdbApiKey) {
                console.error("TMDB_API_KEY is not set in environment variables");
                return new Response(JSON.stringify({ meta: {} }), { headers: CORS_HEADERS });
            }

            try {
                // CHANGED: go straight to the detail endpoint with the TMDB id —
                // no more /find round-trip against a fake IMDb id.
                const detailUrl = `https://api.themoviedb.org/3/${type === "movie" ? "movie" : "tv"}/${tmdbId}?api_key=${tmdbApiKey}`;
                const detailRes = await fetch(detailUrl);

                if (!detailRes.ok) {
                    console.error(`TMDB detail request failed: ${detailRes.status} ${detailRes.statusText}`);
                    return new Response(JSON.stringify({ meta: {} }), { headers: CORS_HEADERS });
                }

                const detail = await detailRes.json();

                const meta = {
                    id: `tmdb:${tmdbId}`,
                    type: type,
                    name: detail.title || detail.name,
                    poster: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
                    background: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
                    description: detail.overview,
                    releaseInfo: (detail.release_date || detail.first_air_date || "").split("-")[0],
                    runtime: type === "movie" && detail.runtime ? `${detail.runtime} min` : null,
                    imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : null
                };

                return new Response(JSON.stringify({ meta }), { headers: CORS_HEADERS });
            } catch (error) {
                console.error("Meta fetch error:", error.message);
                return new Response(JSON.stringify({ meta: {} }), { headers: CORS_HEADERS });
            }
        }

        // 5. Fallback
        return new Response("Snakeeyes Addon is running!", {
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
};
