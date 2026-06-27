const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

// 1. Get a free API key from https://www.themoviedb.org/settings/api
const TMDB_API_KEY = "YOUR_TMDB_API_KEY_HERE"; 

// 2. Define the Manifest (This tells Stremio what catalogs you have)
const manifest = {
    id: "community.snakeeyes.catalog",
    version: "1.0.0",
    name: "Snakeeyes Catalog",
    description: "Custom catalogs for Movies, TV Shows, Directors, and Decades.",
    logo: "https://via.placeholder.com/150", // Replace with your logo URL
    resources: ["catalog", "meta"],
    types: ["movie", "series"],
    idPrefixes: ["tt"], // Standard IMDB ID prefix
    catalogs: [
        // --- MOVIES ---
        { type: "movie", id: "snakeeyes-popular", name: "Movie Collection (Popular)" },
        { type: "movie", id: "snakeeyes-award", name: "Award Winning Films" },
        { type: "movie", id: "snakeeyes-kids", name: "Kids Zone" },
        { type: "movie", id: "snakeeyes-docs", name: "Documentaries" },
        
        // --- DECADES ---
        { type: "movie", id: "snakeeyes-80s", name: "1980s Movies" },
        { type: "movie", id: "snakeeyes-90s", name: "1990s Movies" },
        { type: "movie", id: "snakeeyes-00s", name: "2000s Movies" },

        // --- TV SHOWS ---
        { type: "series", id: "snakeeyes-drama", name: "Drama Series" },
        { type: "series", id: "snakeeyes-comedy", name: "Comedy Series" },
        { type: "series", id: "snakeeyes-horror", name: "Horror Series" },
        { type: "series", id: "snakeeyes-supernatural", name: "Supernatural Shows" },
        
        // --- ACTORS & DIRECTORS (Examples) ---
        { type: "movie", id: "snakeeyes-nolan", name: "Christopher Nolan Collection" },
        { type: "movie", id: "snakeeyes-tarantino", name: "Quentin Tarantino Collection" },
        { type: "movie", id: "snakeeyes-leanardo", name: "Leonardo DiCaprio Films" }
    ]
};

const builder = new addonBuilder(manifest);

// 3. Handle the Catalog Requests
builder.defineCatalogHandler(async ({ type, id }) => {
    console.log(`Requested catalog: ${type} / ${id}`);
    let tmdbUrl = "";

    // Map your custom IDs to TMDB API endpoints
    switch (id) {
        case "snakeeyes-popular": tmdbUrl = `movie/popular`; break;
        case "snakeeyes-award": tmdbUrl = `movie/popular`; // TMDB doesn't have a direct "awards" filter, use popular/top_rated
        case "snakeeyes-kids": tmdbUrl = `discover/movie?certification_country=US&certification.lte=G`; break;
        case "snakeeyes-docs": tmdbUrl = `discover/movie?with_genres=99`; break;
        
        case "snakeeyes-80s": tmdbUrl = `discover/movie?primary_release_date.gte=1980-01-01&primary_release_date.lte=1989-12-31`; break;
        case "snakeeyes-90s": tmdbUrl = `discover/movie?primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31`; break;
        case "snakeeyes-00s": tmdbUrl = `discover/movie?primary_release_date.gte=2000-01-01&primary_release_date.lte=2009-12-31`; break;

        case "snakeeyes-drama": tmdbUrl = `discover/tv?with_genres=18`; break;
        case "snakeeyes-comedy": tmdbUrl = `discover/tv?with_genres=35`; break;
        case "snakeeyes-horror": tmdbUrl = `discover/tv?with_genres=10765`; break; // Sci-Fi & Fantasy often overlaps, or use 9648 (Mystery)
        case "snakeeyes-supernatural": tmdbUrl = `discover/tv?with_keywords=9715`; break; // Supernatural keyword
        
        case "snakeeyes-nolan": tmdbUrl = `discover/movie?with_crew=525`; break; // 525 is Christopher Nolan's TMDB ID
        case "snakeeyes-tarantino": tmdbUrl = `discover/movie?with_crew=138`; break; // 138 is Quentin Tarantino
        case "snakeeyes-leanardo": tmdbUrl = `discover/movie?with_cast=6193`; break; // 6193 is Leonardo DiCaprio
        
        default: tmdbUrl = `movie/popular`;
    }

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/${tmdbUrl}`, {
            params: { api_key: TMDB_API_KEY }
        });

        // Format TMDB data to Stremio format
        const metas = response.data.results.map(item => ({
            id: `tt${item.imdb_id || item.id}`, // Stremio requires IMDB IDs (tt...)
            type: type,
            name: item.title || item.name,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null,
            background: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
            description: item.overview
        }));

        return { metas: metas };
    } catch (error) {
        console.error("TMDB Error:", error);
        return { metas: [] };
    }
});

// 4. Start the server
const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port: port });
console.log(`Snakeeyes Addon running on port ${port}`);
