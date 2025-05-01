const express = require("express");
const { addonBuilder } = require("stremio-addon-sdk");
const bodyParser = require("body-parser");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const fs = require("fs");
const app = express();

const PASTEBIN_URL = "https://pastebin.com/raw/KgQ4jTy6";
const PORT = process.env.PORT || 7000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const builder = new addonBuilder({
    id: "org.stremio.searchaddon",
    version: "1.0.0",
    name: "Ricerca Automatica Streaming",
    description: "Cerca automaticamente film e serie su siti esterni",
    types: ["movie", "series"],
    catalogs: [],
    resources: ["stream"],
    idPrefixes: ["tt"]
});

// Converti IMDb ID in titolo del film
async function imdbToTitle(imdb_id) {
    try {
        const res = await axios.get(`https://www.omdbapi.com/?apikey=56f9b219&i=${imdb_id}`);
        return res.data.Title;
    } catch {
        return null;
    }
}

// Esegue una semplice ricerca HTML nei siti della lista
async function searchInSites(title) {
    try {
        const sitesRes = await axios.get(PASTEBIN_URL);
        const sites = sitesRes.data.split("\n").map(s => s.trim()).filter(Boolean);
        const results = [];

        for (let site of sites) {
            try {
                const searchUrl = site.replace("{query}", encodeURIComponent(title));
                const page = await axios.get(searchUrl);
                const $ = cheerio.load(page.data);

                // Cerca primo link con il titolo
                const found = $("a").filter((i, el) => $(el).text().toLowerCase().includes(title.toLowerCase())).first();
                if (found && found.attr("href")) {
                    results.push({
                        title: `Trovato su ${new URL(site).hostname}`,
                        url: found.attr("href").startsWith("http") ? found.attr("href") : site + found.attr("href"),
                        externalUrl: true
                    });
                }
            } catch (err) {
                console.log("Errore su", site);
            }
        }
        return results;
    } catch {
        return [];
    }
}

builder.defineStreamHandler(async ({ id }) => {
    const title = await imdbToTitle(id);
    if (!title) return { streams: [] };
    const streams = await searchInSites(title);
    return { streams };
});

app.get("/manifest.json", (req, res) => {
    res.json(builder.getInterface().manifest);
});

app.get("/stream/:type/:id.json", async (req, res) => {
    builder.getInterface().stream({ type: req.params.type, id: req.params.id })
        .then(result => res.json(result))
        .catch(err => res.status(500).send(err.message));
});

app.listen(PORT, () => {
    console.log("Addon in ascolto su http://localhost:" + PORT);
});