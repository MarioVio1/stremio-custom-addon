const express = require("express");
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 7000;
const PASTEBIN_URL = "https://pastebin.com/raw/KgQ4jTy6";
const TMDB_API_KEY = "9f6dbcbddf9565f6a0f004fca81f83ee";
const PROXY = "http://pzytldso-rotate:oybm1jw2kflp@p.webshare.io:80";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

let customSites = [];

const builder = new addonBuilder({
    id: "org.stremio.customsearch",
    version: "1.0.0",
    name: "Addon Streaming Avanzato",
    description: "Cerca automaticamente film e serie nei siti personalizzati",
    types: ["movie", "series"],
    catalogs: [],
    resources: ["stream"],
    idPrefixes: ["tt"]
});

// Convert IMDb ID to Title using TMDB
async function getTitleFromTMDB(imdb_id) {
    try {
        const res = await axios.get(`https://api.themoviedb.org/3/find/${imdb_id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
        const movie = res.data.movie_results[0] || res.data.tv_results[0];
        return movie ? movie.title || movie.name : null;
    } catch {
        return null;
    }
}

// Load sites from Pastebin + UI entries
async function loadSites() {
    try {
        const res = await axios.get(PASTEBIN_URL);
        const pasteSites = res.data.split("\n").map(s => s.trim()).filter(Boolean);
        return [...new Set([...pasteSites, ...customSites])];
    } catch {
        return customSites;
    }
}

// Stream Handler
builder.defineStreamHandler(async ({ id }) => {
    const title = await getTitleFromTMDB(id);
    if (!title) return { streams: [] };
    const sites = await loadSites();

    const results = [];
    for (let site of sites) {
        try {
            const url = site.replace("{query}", encodeURIComponent(title));
            const page = await axios.get(url, {
                proxy: {
                    host: "p.webshare.io",
                    port: 80,
                    auth: { username: "pzytldso-rotate", password: "oybm1jw2kflp" }
                }
            });
            const $ = cheerio.load(page.data);
            const found = $("a").filter((i, el) => $(el).text().toLowerCase().includes(title.toLowerCase())).first();
            if (found && found.attr("href")) {
                results.push({
                    title: `Trovato su ${new URL(url).hostname}`,
                    url: found.attr("href").startsWith("http") ? found.attr("href") : url + found.attr("href"),
                    externalUrl: true
                });
            }
        } catch (err) {
            console.log("Errore con sito:", site);
        }
    }

    return { streams: results };
});

app.get("/manifest.json", (req, res) => res.json(builder.getInterface().manifest));

app.get("/stream/:type/:id.json", async (req, res) => {
    builder.getInterface().stream({ type: req.params.type, id: req.params.id })
        .then(resp => res.json(resp))
        .catch(err => res.status(500).send(err.message));
});

// UI Endpoints
app.get("/api/sites", async (req, res) => {
    const sites = await loadSites();
    const results = await Promise.all(sites.map(async s => {
        try {
            await axios.get(s.replace("{query}", "test"), { timeout: 5000 });
            return { url: s, status: "online" };
        } catch {
            return { url: s, status: "offline" };
        }
    }));
    res.json(results);
});

app.post("/api/sites", (req, res) => {
    const { url } = req.body;
    if (url && url.includes("{query}")) {
        customSites.push(url);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "URL non valido" });
    }
});

app.listen(PORT, () => console.log("Addon attivo su http://localhost:" + PORT));