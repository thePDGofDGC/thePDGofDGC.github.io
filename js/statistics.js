let statisticsCharts = [];

function destroyStatisticsCharts() {
    statisticsCharts.forEach(chart => chart.destroy());
    statisticsCharts = [];
}

function createChart(id, config) {
    const canvas = document.getElementById(id);

    if (!canvas) return;

    const chart = new Chart(canvas, config);
    statisticsCharts.push(chart);
}

function loadStatistics() {
    destroyStatisticsCharts();

    loadMonthlyWinrateChart();
    loadCurrentWinrateChart();
    loadMonthlyEloChart();
    loadCurrentEloChart();
}

function loadMonthlyWinrateChart() {
    const months = window.uctDatabase.queryAll(`
        SELECT month, wins, losses
        FROM monthly_history
        ORDER BY month ASC
    `);

    const labels = months.map(m => m.month);
    const values = months.map(m => {
        const games = m.wins + m.losses;
        return games > 0 ? (m.wins / games) * 100 : 0;
    });

    createChart("monthly-winrate-chart", {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Winrate (%)",
                data: values,
                backgroundColor: "#a78bfa",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => `${value} %`
                    }
                }
            }
        }
    });
}

function loadCurrentWinrateChart() {
    const matches = window.uctDatabase.queryAll(`
        SELECT date, result
        FROM matches
        WHERE substr(date, 1, 7) = (
            SELECT current_month FROM player WHERE singleton_id = 1
        )
        ORDER BY date ASC, game_id ASC
    `);

    let wins = 0;
    const values = [];

    matches.forEach((match, index) => {
        if (match.result === "victory") wins++;

        values.push(
            ((wins / (index + 1)) * 100).toFixed(1)
        );
    });

    createChart("current-winrate-chart", {
        type: "line",
        data: {
            labels: matches.map((_, i) => `Partie ${i + 1}`),
            datasets: [{
                label: "Winrate (%)",
                data: values,
                borderColor: "#a78bfa",
                backgroundColor: "#a78bfa",
                tension: 0.25,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => `${value} %`
                    }
                }
            }
        }
    });
}

function loadMonthlyEloChart() {
    const months = window.uctDatabase.queryAll(`
        SELECT month, elo_end
        FROM monthly_history
        WHERE elo_end IS NOT NULL
        ORDER BY month ASC
    `);

    createChart("monthly-elo-chart", {
        type: "bar",
        data: {
            labels: months.map(m => m.month),
            datasets: [{
                label: "ELO",
                data: months.map(m => m.elo_end),
                backgroundColor: "#38bdf8",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function loadCurrentEloChart() {
    const matches = window.uctDatabase.queryAll(`
        SELECT date, new_elo
        FROM matches
        WHERE substr(date, 1, 7) = (
            SELECT current_month FROM player WHERE singleton_id = 1
        )
        ORDER BY date ASC, game_id ASC
    `);

    createChart("current-elo-chart", {
        type: "line",
        data: {
            labels: matches.map((_, i) => `Partie ${i + 1}`),
            datasets: [{
                label: "ELO",
                data: matches.map(m => m.new_elo),
                borderColor: "#38bdf8",
                backgroundColor: "#38bdf8",
                tension: 0.25,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
