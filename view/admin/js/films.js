document.addEventListener("DOMContentLoaded", async () => {

    let listeFilms = [];         // cache local de la liste des films
    let idFilmASupprimer = null; // film en attente de confirmation de suppression

    const logoutBtn = document.getElementById("logoutBtn");
    const corpsTableau = document.getElementById("corpsTableauFilms");
    const totalFilmsEl = document.getElementById("totalFilms");
    const vuesTotalesEl = document.getElementById("vuesTotales");
    const moyenneNotesEl = document.getElementById("moyenneNotes");
    const champRecherche = document.getElementById("rechercheFilmAdmin");
    const btnAjouterFilm = document.getElementById("btnAjouterFilm");

    const modaleSuppression = document.getElementById("modaleConfirmationSuppression");
    const texteSuppression = document.getElementById("texteConfirmationSuppression");
    const btnConfirmerSuppression = document.getElementById("btnConfirmerSuppression");
    const btnAnnulerSuppression = document.getElementById("btnAnnulerSuppression");

    // =========================
    // Déconnexion
    // =========================

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

    // =========================
    // Identité admin
    // =========================

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

    // =========================
    // Navigation vers la fiche film (création / édition)
    // =========================

    if (btnAjouterFilm) {
        btnAjouterFilm.addEventListener("click", () => {
            window.location.href = "/movie/public/index.php?action=admin-film-edit";
        });
    }

    function allerVersEdition(film) {
        window.location.href = `/movie/public/index.php?action=admin-film-edit&id=${film.id}`;
    }

    // =========================
    // Utilitaires d'affichage
    // =========================

    function formatVues(nombre) {
        if (nombre >= 1000) {
            return (nombre / 1000).toFixed(1).replace(".0", "") + "K";
        }
        return String(nombre);
    }

    function mettreAJourKpis(films) {
        if (totalFilmsEl) totalFilmsEl.textContent = films.length;

        if (vuesTotalesEl) {
            const totalVues = films.reduce((somme, f) => somme + (f.nombre_vues || 0), 0);
            vuesTotalesEl.textContent = formatVues(totalVues);
        }

        if (moyenneNotesEl) {
            const filmsNotes = films.filter(f => (f.nombre_notes || 0) > 0);
            const moyenne = filmsNotes.length
                ? filmsNotes.reduce((s, f) => s + (f.note_moyenne || 0), 0) / filmsNotes.length
                : 0;
            moyenneNotesEl.textContent = `${moyenne.toFixed(1)}/5`;
        }
    }

    // =========================
    // Chargement & affichage des films
    // =========================

    function creerLigneFilm(film) {
        const tr = document.createElement("tr");
        tr.dataset.id = film.id;

        const genres = Array.isArray(film.genres) ? film.genres.join(", ") : (film.genre_principal || "-");
        const statutClasse = film.est_publie ? "publiee" : "brouillon";
        const statutTexte = film.est_publie ? "Publié" : "Brouillon";

        tr.innerHTML = `
            <td>
                <img src="${film.poster || ''}" alt="Affiche ${film.titre}"
                     style="width:48px; height:68px; object-fit:cover; border-radius:6px; background: rgba(255,255,255,0.05);">
            </td>
            <td style="font-weight:600; color: var(--blanc);">${film.titre}</td>
            <td>${genres}</td>
            <td>${film.annee_sortie}</td>
            <td>${film.duree_formatee || film.duree_minutes + " min"}</td>
            <td><span class="statut-badge ${statutClasse}">${statutTexte}</span></td>
            <td style="text-align:right;">
                <button class="btn-table-action btn-modifier-film" title="Modifier">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-table-action delete btn-supprimer-film" title="Supprimer">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        tr.querySelector(".btn-modifier-film").addEventListener("click", () => allerVersEdition(film));
        tr.querySelector(".btn-supprimer-film").addEventListener("click", () => ouvrirModaleSuppression(film));

        return tr;
    }

    function afficherFilms(films) {
        if (!corpsTableau) return;

        corpsTableau.innerHTML = "";

        if (!films.length) {
            corpsTableau.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; color: var(--gris-clair); padding: 30px;">
                        Aucun film trouvé.
                    </td>
                </tr>
            `;
            return;
        }

        films.forEach(film => corpsTableau.appendChild(creerLigneFilm(film)));
    }

    async function chargerFilms() {
        try {
            const { success, message, data } = await api.getFilms();

            if (!success) {
                showMessage("error", message || "Impossible de charger les films");
                return;
            }

            listeFilms = data || [];

            mettreAJourKpis(listeFilms);
            afficherFilms(listeFilms);

        } catch (error) {
            console.error("Erreur chargement films", error);
            showMessage("error", "Erreur serveur lors du chargement des films");
        }
    }

    // =========================
    // Recherche (filtrage local)
    // =========================

    if (champRecherche) {
        champRecherche.addEventListener("input", () => {
            const requete = champRecherche.value.trim().toLowerCase();

            if (!requete) {
                afficherFilms(listeFilms);
                return;
            }

            const filtres = listeFilms.filter(film => {
                const genres = Array.isArray(film.genres) ? film.genres.join(", ") : "";
                return (film.titre || "").toLowerCase().includes(requete) ||
                    genres.toLowerCase().includes(requete);
            });

            afficherFilms(filtres);
        });
    }

    // =========================
    // Modale suppression
    // =========================

    function ouvrirModaleSuppression(film) {
        idFilmASupprimer = film.id;
        if (texteSuppression) {
            texteSuppression.textContent = `Voulez-vous vraiment supprimer « ${film.titre} » ? Cette action est irréversible.`;
        }
        if (modaleSuppression) modaleSuppression.style.display = "flex";
    }

    function fermerModaleSuppression() {
        idFilmASupprimer = null;
        if (modaleSuppression) modaleSuppression.style.display = "none";
    }

    if (btnAnnulerSuppression) {
        btnAnnulerSuppression.addEventListener("click", fermerModaleSuppression);
    }

    if (btnConfirmerSuppression) {
        btnConfirmerSuppression.addEventListener("click", async () => {
            if (!idFilmASupprimer) return;

            btnConfirmerSuppression.disabled = true;

            try {
                const { success, message } = await api.deleteFilm(idFilmASupprimer);

                if (success) {
                    showMessage("success", message || "Film supprimé");
                    fermerModaleSuppression();
                    await chargerFilms();
                } else {
                    showMessage("error", message || "Suppression impossible");
                }

            } catch (error) {
                console.error("Erreur suppression film", error);
                showMessage("error", "Erreur serveur");
            } finally {
                btnConfirmerSuppression.disabled = false;
            }
        });
    }

    if (modaleSuppression) {
        modaleSuppression.addEventListener("click", (e) => {
            if (e.target === modaleSuppression) {
                fermerModaleSuppression();
            }
        });
    }

    // =========================
    // Initialisation
    // =========================

    await chargerAdmin();
    await chargerFilms();

});