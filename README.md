# Stremio Search Addon

Addon per Stremio che cerca automaticamente film/serie in una lista di siti (simile a Veezie/MammaMia).

## Come funziona

- Recupera il titolo del contenuto da IMDb
- Legge la lista di siti da: https://pastebin.com/raw/KgQ4jTy6
- Cerca il titolo nei siti (uso base di scraping)
- Mostra i risultati cliccabili su Stremio

## Come usarlo

1. Clona e installa:
   ```bash
   npm install
   ```

2. Avvia:
   ```bash
   npm start
   ```

3. Aggiungi addon a Stremio:
   ```
   http://localhost:7000/manifest.json
   ```

---

Lista di siti nel formato:
```
https://ilmiosito.to/search?q={query}
https://altronsito.com/find/{query}
```