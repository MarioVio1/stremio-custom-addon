# Stremio Custom Addon

Questo è un addon per Stremio che ti permette di configurare i tuoi siti di streaming tramite una pagina web.

## Come si usa

1. Clona il repository e installa le dipendenze:
   ```bash
   npm install
   ```

2. Avvia il server:
   ```bash
   npm start
   ```

3. Vai su `http://localhost:7000` per vedere la pagina web.

4. Inserisci i tuoi siti con pattern tipo:
   ```
   https://ilmiosito.to/watch/{imdb_id}
   ```

5. Aggiungi l'addon a Stremio usando questo URL:
   ```
   http://localhost:7000/manifest.json
   ```

## Deploy su Render

1. Carica su GitHub.
2. Crea un Web Service su Render.
3. Usa `npm install` come build command.
4. Usa `npm start` come start command.

Fatto! 🎬