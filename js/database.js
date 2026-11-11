
const DATABASE_URL = "data/undercards.sqlite";

let database = null;

/**
 * Charge la base SQLite depuis le serveur.
 */
async function loadDatabase() {
    const status = document.getElementById("database-status");

    try {
        status.textContent = "Chargement de SQLite...";

        // Initialise sql.js.
        const SQL = await initSqlJs({
            locateFile: file =>
                `https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/${file}`
        });

        // Télécharge le fichier SQLite.
        const response = await fetch(DATABASE_URL);

        if (!response.ok) {
            throw new Error(
                `Impossible de récupérer la base : HTTP ${response.status}`
            );
        }

        const buffer = await response.arrayBuffer();

        // Ouvre la base en mémoire.
        database = new SQL.Database(new Uint8Array(buffer));

        status.textContent = "Base de données chargée";

        return database;

    } catch (error) {
        console.error("[UnderCards Tracker]", error);

        status.textContent = "Erreur de chargement de la base";

        throw error;
    }
}

/**
 * Exécute une requête SQL et retourne toutes les lignes.
 *
 * @param {string} sql Requête SQL
 * @param {Array} parameters Paramètres de la requête
 * @returns {Array<Object>}
 */
function queryAll(sql, parameters = []) {
    if (!database) {
        throw new Error("La base de données n'est pas chargée.");
    }

    const statement = database.prepare(sql);
    const results = [];

    try {
        statement.bind(parameters);

        while (statement.step()) {
            results.push(statement.getAsObject());
        }
    } finally {
        statement.free();
    }

    return results;
}

/**
 * Exécute une requête SQL et retourne la première ligne.
 *
 * @param {string} sql Requête SQL
 * @param {Array} parameters Paramètres de la requête
 * @returns {Object|null}
 */
function queryOne(sql, parameters = []) {
    const results = queryAll(sql, parameters);

    return results.length > 0 ? results[0] : null;
}

// Promesse partagée : les autres scripts peuvent attendre son chargement.
window.databaseReady = loadDatabase();

window.uctDatabase = {
    queryAll,
    queryOne
};
