
const numberFormatter = new Intl.NumberFormat("fr-FR");

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
});

/**
 * Formate un nombre.
 */
function formatNumber(value) {
    if (value === null || value === undefined) {
        return "--";
    }

    return numberFormatter.format(value);
}

/**
 * Formate une date SQLite.
 */
function formatDate(value) {
    if (!value) {
        return "--";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return dateFormatter.format(date);
}

/**
 * Modifie le contenu d'un élément HTML.
 */
function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? "--";
    }
}

/**
 * Charge les informations du joueur.
 */
function loadPlayer() {
    const player = window.uctDatabase.queryOne(`
        SELECT *
        FROM player
        WHERE singleton_id = 1
    `);

    if (!player) {
        throw new Error("Aucun joueur trouvé dans la base.");
    }

    setText("player-name", player.username);
    setText("player-division", player.division);
    setText("player-elo", formatNumber(player.elo));
    setText("player-gold", formatNumber(player.gold));
    setText("player-xp", formatNumber(player.xp));
    setText(
        "player-xp-next",
        formatNumber(player.xp_until_next_level)
    );

    setText("current-month", player.current_month);
    setText(
        "last-updated",
        `Dernière mise à jour : ${formatDate(player.last_updated)}`
    );

    return player;
}

/**
 * Charge les statistiques du mois courant.
 */
function loadMonthlyStats(month) {
    const stats = window.uctDatabase.queryOne(`
        SELECT
            COUNT(*) AS games,
            SUM(CASE WHEN result = 'victory' THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN result = 'defeat' THEN 1 ELSE 0 END) AS losses
        FROM matches
        WHERE substr(date, 1, 7) = ?
    `, [month]);

    const wins = stats.wins ?? 0;
    const losses = stats.losses ?? 0;
    const games = stats.games ?? 0;

    const winrate = games > 0
        ? (wins / games) * 100
        : 0;

    setText("monthly-wins", formatNumber(wins));
    setText("monthly-losses", formatNumber(losses));
    setText("monthly-games", formatNumber(games));
    setText("monthly-winrate", `${winrate.toFixed(1)} %`);
}

function loadTotalStats() {
    const stats = window.uctDatabase.queryOne(`
        SELECT
            COALESCE(SUM(global_wins), 0) AS wins,
            COALESCE(SUM(global_losses), 0) AS losses
        FROM adversaries
    `);

    const wins = stats.wins;
    const losses = stats.losses;
    const games = wins + losses;
    const winrate = games > 0 ? (wins / games) * 100 : 0;

    setText("total-wins", formatNumber(wins));
    setText("total-losses", formatNumber(losses));
    setText("total-games", formatNumber(games));
    setText("total-winrate", `${winrate.toFixed(1)} %`);
}

/**
 * Charge les dernières parties.
 */

/**
 * Formate une liste d'artefacts.
 */
function formatArtifacts(value) {
    if (!value) {
        return "--";
    }

    try {
        const artifacts = typeof value === "string"
            ? JSON.parse(value)
            : value;

        if (!Array.isArray(artifacts) || artifacts.length === 0) {
            return "--";
        }

        return artifacts.join(", ");
    } catch {
        return "--";
    }
}

/**
 * Charge les dernières parties.
 */
function loadRecentMatches() {
    const player = window.uctDatabase.queryOne(`
        SELECT current_month
        FROM player
        WHERE singleton_id = 1
    `);

    const matches = window.uctDatabase.queryAll(`
        SELECT
            matches.date,
            matches.result,
            matches.soul,
            matches.opponent_soul,
            matches.artifacts,
            matches.opponent_artifacts,
            matches.old_elo,
            matches.new_elo,
            adversaries.opponent_name
        FROM matches
        LEFT JOIN adversaries
            ON matches.opponent_id = adversaries.opponent_id
        WHERE substr(matches.date, 1, 7) = ?
        ORDER BY matches.date DESC, matches.game_id DESC
    `, [player.current_month]);

    const tbody = document.getElementById("recent-matches");
    tbody.replaceChildren();

    if (matches.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = "Aucune partie enregistrée ce mois-ci.";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    for (const match of matches) {
        const row = document.createElement("tr");

        const eloChange =
            match.old_elo !== null && match.new_elo !== null
                ? match.new_elo - match.old_elo
                : null;

        const values = [
            formatDate(match.date),
            match.opponent_name ?? "Inconnu",
            match.result === "victory" ? "Victoire" : "Défaite"
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 2) {
                cell.classList.add(
                    match.result === "victory"
                        ? "result-victory"
                        : "result-defeat"
                );
            }

            row.appendChild(cell);
        });

        // Âmes
        const soulCell = document.createElement("td");
        soulCell.classList.add("match-details");

        const playerSoul = document.createElement("div");
        playerSoul.textContent = `Toi : ${match.soul ?? "--"}`;

        const opponentSoul = document.createElement("div");
        opponentSoul.textContent = `Adversaire : ${match.opponent_soul ?? "--"}`;

        soulCell.append(playerSoul, opponentSoul);
        row.appendChild(soulCell);

        // Artefacts
        const artifactsCell = document.createElement("td");
        artifactsCell.classList.add("match-details", "match-artifacts");

        const playerArtifacts = document.createElement("div");
        playerArtifacts.textContent =
            `Toi : ${formatArtifacts(match.artifacts)}`;

        const opponentArtifacts = document.createElement("div");
        opponentArtifacts.textContent =
            `Adversaire : ${formatArtifacts(match.opponent_artifacts)}`;

        artifactsCell.append(playerArtifacts, opponentArtifacts);
        row.appendChild(artifactsCell);

        // Variation ELO
        const eloCell = document.createElement("td");
        eloCell.classList.add("elo-change");

        eloCell.textContent = eloChange === null
            ? "--"
            : `${eloChange > 0 ? "+" : ""}${eloChange}`;

        row.appendChild(eloCell);

        tbody.appendChild(row);
    }
}


function loadAdversaries() {
    const adversaries = window.uctDatabase.queryAll(`
        SELECT
            opponent_name,
            global_wins,
            global_losses,
            last_seen
        FROM adversaries
        ORDER BY (global_wins + global_losses) DESC
    `);

    const tbody = document.getElementById("adversaries-table");

    tbody.innerHTML = adversaries.map(adversary => {
        // Les victoires de l'adversaire sont tes défaites, et inversement.
        const wins = Number(adversary.global_wins);
        const losses = Number(adversary.global_losses);
        const games = wins + losses;

        const winrate = games > 0
            ? (wins / games * 100).toFixed(1)
            : "0.0";

        const lastSeen = new Date(adversary.last_seen)
            .toLocaleDateString("fr-FR");

        return `
            <tr>
                <td>${adversary.opponent_name}</td>
                <td>${wins}</td>
                <td>${losses}</td>
                <td>${games}</td>
                <td>${winrate} %</td>
                <td>${lastSeen}</td>
            </tr>
        `;
    }).join("");
}


/**
 * Actualise le dashboard et les graphiques.
 */
function refreshDashboard() {
    const player = loadPlayer();

    loadMonthlyStats(player.current_month);
    loadTotalStats();
    loadRecentMatches();
    loadAdversaries();
    loadStatistics();
}

/**
 * Initialise le dashboard.
 */
async function initializeDashboard() {
    try {
        await window.databaseReady;
        refreshDashboard();

    } catch (error) {
        console.error("[UnderCards Tracker]", error);

        const status = document.getElementById("database-status");
        status.textContent = "Erreur lors du chargement des statistiques";
    }
}

// Changement de joueur.
document.getElementById("player-select").addEventListener("change", async event => {
    try {
        await window.loadPlayerDatabase(event.target.value);
        refreshDashboard();

    } catch (error) {
        console.error("[UnderCards Tracker]", error);

        const status = document.getElementById("database-status");
        status.textContent = "Erreur lors du changement de joueur";
    }
});

initializeDashboard();
