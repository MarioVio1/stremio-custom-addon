const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const app = express();
const PORT = 7000;
const TMDB_API_KEY = "9f6dbcbddf9565f6a0f004fca81f83ee";
const PROXY = "http://pzytldso-rotate:oybm1jw2kflp@p.webshare.io:80/";

let customSites = [];  // Lista dei siti personalizzati

// Build dell'addon
const builder = new addonBuilder({
    id: "org.stremio.customsearch",
    version: "1.0.0",
    name: "Addon Streaming",
    types: ["movie", "series"],
    resources: ["stream"],
    idPrefixes: ["tt"],  // IMDb ID
});

// Funzione per ottenere il titolo da TMDB
async function getTitleFromTMDB(imdb_id) {
    try {
        console.log(`Ricerca titolo per IMDb ID: ${imdb_id}`);
        const res = await axios.get(`https://api.themoviedb.org/3/find/${imdb_id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
        const movie = res.data.movie_results[0] || res.data.tv_results[0];
        if (movie) {
            console.log(`Titolo trovato: ${movie.title || movie.name}`);
            return movie.title || movie.name;
        }
        return null;
    } catch (err) {
        console.error("Errore nel recupero del titolo da TMDB:", err);
        return null;
    }
}

// Funzione per gestire la ricerca dei flussi (stream)
builder.defineStreamHandler(async ({ id }) => {
    console.log(`Ricerca per il film con IMDb ID: ${id}`);
    
    // Ottieni il titolo da TMDB
    const title = await getTitleFromTMDB(id);
    if (!title) {
        console.log("Titolo non trovato, nessun flusso disponibile");
        return { streams: [] };  // Nessun flusso trovato
    }

    console.log(`Inizio ricerca flussi per il titolo: ${title}`);
    
    // Aggiungi i siti personalizzati dalla lista (potrebbe essere da Pastebin o configurabili manualmente)
    const sites = await loadSites();
    const results = [];

    for (let site of sites) {
        try {
            console.log(`Controllo sito: ${site}`);
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
                console.log(`Trovato flusso su: ${url}`);
                results.push({
                    title: `Trovato su ${new URL(url).hostname}`,
                    url: found.attr("href").startsWith("http") ? found.attr("href") : url + found.attr("href"),
                    externalUrl: true
                });
            }
        } catch (err) {
            console.log("Errore nel sito", site, err);
        }
    }

    return { streams: results };
});

// Funzione per caricare i siti da Pastebin
async function loadSites() {
    try {
        console.log("Caricamento siti da Pastebin...");
        const res = await axios.get("https://pastebin.com/raw/KgQ4jTy6");
        const pasteSites = res.data.split("\n").map(s => s.trim()).filter(Boolean);
        return [...new Set([...pasteSites, ...customSites])];  // Unisci siti da Pastebin e personalizzati
    } catch (err) {
        console.error("Errore nel caricamento dei siti da Pastebin:", err);
        return customSites;
    }
}

// Endpoint del manifest
app.get("/manifest.json", (req, res) => res.json(builder.getInterface().manifest));

// Avvia il server
app.listen(PORT, () => {
    console.log(`Addon attivo su http://localhost:${PORT}`);
});
