document.addEventListener("DOMContentLoaded", async () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            try {
                const { success, message, redirect } = await api.logout();

                if (success) {
                    showMessage("success", message);

                    setTimeout(() => {
                        window.location.href = redirect;
                    }, 1000);

                } else {
                    showMessage("error", message);
                }

            } catch (error) {
                showMessage("error", "Erreur serveur");
            }
        });
    }

    function formatterDate(dateStr) {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        if (isNaN(d)) return "—";
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    }

    function afficherKpis(stats) {
        const kpiTotalFilms = document.getElementById("kpiTotalFilms");
        const kpiFilmPopulaire = document.getElementById("kpiFilmPopulaire");
        const kpiFilmPopulaireVues = document.getElementById("kpiFilmPopulaireVues");

        if (kpiTotalFilms) {
            kpiTotalFilms.textContent = stats.total_films;
        }
        if (kpiFilmPopulaire) {
            kpiFilmPopulaire.textContent = stats.film_populaire || "Aucun film";
        }
        if (kpiFilmPopulaireVues) {
            kpiFilmPopulaireVues.textContent = stats.film_populaire_vues;
        }
    }

    function afficherDerniersFilms(films) {
        const conteneur = document.getElementById("carouselDerniersFilms");
        if (!conteneur) return;

        if (films.length === 0) {
            conteneur.innerHTML = `<p style="color: var(--gris-clair); padding: 10px;">Aucun film pour le moment</p>`;
            return;
        }

        conteneur.innerHTML = films.map(film => `
            <div class="carte-dernier-film">
                <a href="/movie/public/index.php?action=admin-films">
                    <img src="${film.poster}" alt="${film.titre}">
                </a>
                <div class="carte-dernier-film-infos">
                    <div class="carte-dernier-film-titre" title="${film.titre}">${film.titre}</div>
                    <div class="carte-dernier-film-meta">
                        <span>${film.genre_principal ?? "—"}</span>
                        <span>${film.annee_sortie}</span>
                    </div>
                </div>
            </div>
        `).join("");
    }

    function initCarouselNav() {
        const conteneur = document.getElementById("carouselDerniersFilms");
        const prevBtn = document.getElementById("carouselDerniersPrev");
        const nextBtn = document.getElementById("carouselDerniersNext");

        if (!conteneur || !prevBtn || !nextBtn) return;

        const pas = () => conteneur.querySelector(".carte-dernier-film")?.offsetWidth + 16 || 166;

        prevBtn.addEventListener("click", () => {
            conteneur.scrollBy({ left: -pas(), behavior: "smooth" });
        });

        nextBtn.addEventListener("click", () => {
            conteneur.scrollBy({ left: pas() * 1, behavior: "smooth" });
        });
    }

    function injectAdminIdentity(user) {
        const nomSidebar = document.getElementById("nomAdminConnecte");
        const nomHeader = document.querySelector(".profil-utilisateur span");

        if (nomSidebar) {
            nomSidebar.textContent = user.nom_utilisateur;
        }

        if (nomHeader) {
            nomHeader.textContent = user.nom_utilisateur;
        }

        const avatars = document.querySelectorAll(".avatar-grand, .avatar-petit");
        avatars.forEach(avatar => {
            if (user.url_photo_profil) {
                avatar.src = user.url_photo_profil;
            }
        });
    }

    async function chargerAdmin() {
        try {
            const { success, user } = await api.getCurrentUser();

            if (!success || !user) {
                console.log("Administrateur non connecté");
                return;
            }

            injectAdminIdentity(user);

        } catch (error) {
            console.error("Erreur chargement identité admin", error);
        }
    }

    async function chargerDashboard() {
        try {
            const { success, stats, derniers_films } = await api.getAdminDashboard();

            if (!success) {
                console.error("Impossible de charger les données du dashboard");
                return;
            }

            afficherKpis(stats);
            afficherDerniersFilms(derniers_films);

        } catch (error) {
            console.error("Erreur chargement dashboard admin", error);
        }
    }

    initCarouselNav();
    await chargerAdmin();
    await chargerDashboard();
});