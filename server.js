const express = require("express");
const { addonBuilder } = require("stremio-addon-sdk");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 7000;
const SITES_FILE = "./sites.json";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Load or initialize sites list
function loadSites() {
    if (!fs.existsSync(SITES_FILE)) fs.writeFileSync(SITES_FILE, JSON.stringify([]));
    return JSON.parse(fs.readFileSync(SITES_FILE));
}

function saveSites(sites) {
    fs.writeFileSync(SITES_FILE, JSON.stringify(sites, null, 2));
}

// Stream handler
const builder = new addonBuilder({
    id: "org.custom.stremio.addon",
    version: "1.0.0",
    name: "Custom Streaming Sites",
    description: "Guarda film/serie da siti personalizzati",
    types: ["movie", "series"],
    catalogs: [],
    resources: ["stream"],
    idPrefixes: ["tt"]
});

builder.defineStreamHandler(({ id, type }) => {
    const sites = loadSites();
    const streams = sites.map(site => ({
        title: site.name,
        url: site.urlPattern.replace("{imdb_id}", id),
        externalUrl: true
    }));
    return Promise.resolve({ streams });
});

app.get("/manifest.json", (req, res) => {
    res.json(builder.getInterface().manifest);
});

app.get("/stream/:type/:id.json", (req, res) => {
    builder.getInterface().stream({ type: req.params.type, id: req.params.id })
        .then(result => res.json(result))
        .catch(err => res.status(500).send(err.message));
});

// API per siti custom
app.get("/api/sites", (req, res) => {
    res.json(loadSites());
});

app.post("/api/sites", (req, res) => {
    const sites = loadSites();
    sites.push(req.body);
    saveSites(sites);
    res.json({ success: true });
});

app.delete("/api/sites/:index", (req, res) => {
    const sites = loadSites();
    sites.splice(req.params.index, 1);
    saveSites(sites);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log("Addon running on http://localhost:" + PORT);
});