const pages = {
    dashboard: {
        title: "Dashboard",
        description: "Vue générale de tes statistiques"
    },
    statistics: {
        title: "Statistiques",
        description: "Évolution de tes performances"
    },
    matches: {
        title: "Parties",
        description: "Historique des parties du mois en cours"
    },
    adversaries: {
        title: "Adversaires",
        description: "Statistiques de tes adversaires"
    }
};

function navigateTo(pageId) {
    if (!pages[pageId]) {
        pageId = "dashboard";
    }

    // Afficher uniquement la section sélectionnée.
    Object.keys(pages).forEach(id => {
        document.getElementById(id).hidden = id !== pageId;
    });

    // Mettre à jour le lien actif.
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${pageId}`
        );
    });

    // Mettre à jour le titre.
    document.querySelector(".topbar h2").textContent =
        pages[pageId].title;

    document.querySelector(".topbar p").textContent =
        pages[pageId].description;
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const pageId = link.getAttribute("href").substring(1);

        navigateTo(pageId);
        history.pushState(null, "", `#${pageId}`);
    });
});

// Gérer les boutons précédent/suivant du navigateur.
window.addEventListener("popstate", () => {
    navigateTo(location.hash.substring(1));
});

// Afficher la bonne page au chargement.
navigateTo(location.hash.substring(1) || "dashboard");