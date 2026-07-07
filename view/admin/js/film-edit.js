document.addEventListener("DOMContentLoaded", async () => {

    const parametresUrl = new URLSearchParams(window.location.search);
    const idFilm = parametresUrl.get("id"); // null en mode création
    const modeEdition = !!idFilm;

    const logoutBtn = document.getElementById("logoutBtn");

    const titrePage = document.getElementById("titrePageFilm");
    const formFilm = document.getElementById("formFilm");
    const btnEnregistrer = document.getElementById("btnEnregistrerFilm");

    const champTitre = document.getElementById("titreFilm");
    const champRealisateur = document.getElementById("realisateurFilm");
    const champSynopsis = document.getElementById("synopsisFilm");
    const champAnnee = document.getElementById("anneeFilm");
    const champDuree = document.getElementById("dureeFilm");
    const champAffiche = document.getElementById("afficheFilm");
    const champTrailer = document.getElementById("trailerFilm");
    const champVideo = document.getElementById("videoFilm");
    const champPublie = document.getElementById("publieFilm");
    const champAutreGenre = document.getElementById("autreGenreFilm");

    const apercuPoster = document.getElementById("apercuPoster");
    const genresGrille = document.getElementById("genresGrille");

    const btnTesterVideo = document.getElementById("btnTesterVideo");
    const statutTestVideo = document.getElementById("statutTestVideo");
    const cadreVideoTest = document.getElementById("cadreVideoTest");
    const videoTest = document.getElementById("videoTest");

    // =========================
    // Déconnexion + identité admin (identique aux autres pages admin)
    // =========================

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                const { success, message, redirect } = await api.logout();
                if (success) {
                    showMessage("success", message);
                    setTimeout(() => { window.location.href = redirect; }, 1000);
                } else {
                    showMessage("error", message);
                }
            } catch (error) {
                showMessage("error", "Erreur serveur");
            }
        });
    }

    function injectAdminIdentity(user) {
        const nomSidebar = document.getElementById("nomAdminConnecte");
        const nomHeader = document.querySelector(".profil-utilisateur span");
        if (nomSidebar) nomSidebar.textContent = user.nom_utilisateur;
        if (nomHeader) nomHeader.textContent = user.nom_utilisateur;

        document.querySelectorAll(".avatar-grand, .avatar-petit").forEach(avatar => {
            if (user.url_photo_profil) avatar.src = user.url_photo_profil;
        });
    }

    async function chargerAdmin() {
        try {
            const { success, user } = await api.getCurrentUser();
            if (success && user) injectAdminIdentity(user);
        } catch (error) {
            console.error("Erreur chargement identité admin", error);
        }
    }

    // =========================
    // Aperçu de l'affiche en direct
    // =========================

    function mettreAJourApercuPoster() {
        const url = champAffiche.value.trim();
        apercuPoster.src = url || "";
    }

    champAffiche.addEventListener("input", mettreAJourApercuPoster);
    apercuPoster.addEventListener("error", () => {
        apercuPoster.style.opacity = "0.3";
    });
    apercuPoster.addEventListener("load", () => {
        apercuPoster.style.opacity = "1";
    });

    // =========================
    // Genres (checkbox, chargés depuis la vraie table `genres`)
    // =========================

    let genresSelectionnesInitialement = [];

    function creerGenreChip(genre) {
        const label = document.createElement("label");
        label.className = "genre-chip";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = genre.nom;
        input.dataset.nom = genre.nom;

        const span = document.createElement("span");
        span.textContent = genre.nom;

        label.appendChild(input);
        label.appendChild(span);

        input.addEventListener("change", () => {
            label.classList.toggle("selectionne", input.checked);
        });

        genresGrille.appendChild(label);
        return input;
    }

    async function chargerGenres() {
        try {
            const { success, data } = await api.getGenres();

            if (!success || !data) {
                genresGrille.innerHTML = "<p style='color:var(--gris-clair); font-size:13px;'>Impossible de charger les genres.</p>";
                return;
            }

            genresGrille.innerHTML = "";

            data.forEach(genre => {
                const input = creerGenreChip(genre);

                if (genresSelectionnesInitialement.includes(genre.nom)) {
                    input.checked = true;
                    input.closest(".genre-chip").classList.add("selectionne");
                }
            });

        } catch (error) {
            console.error("Erreur chargement genres", error);
        }
    }

    function genresSelectionnes() {
        return Array.from(genresGrille.querySelectorAll("input[type='checkbox']:checked"))
            .map(input => input.dataset.nom);
    }

    // =========================
    // Chargement du film existant (mode édition)
    // =========================

    async function chargerFilmExistant() {
        try {
            const { success, data, message } = await api.getAdminFilm(idFilm);

            if (!success || !data) {
                showMessage("error", message || "Film introuvable");
                setTimeout(() => {
                    window.location.href = "/movie/public/index.php?action=admin-films";
                }, 1200);
                return;
            }

            champTitre.value = data.titre || "";
            champRealisateur.value = data.realisateur || "";
            champSynopsis.value = data.synopsis || "";
            champAnnee.value = data.annee_sortie || "";
            champDuree.value = data.duree_minutes || "";
            champAffiche.value = data.poster || "";
            champTrailer.value = data.url_trailer || "";
            champVideo.value = data.video_path || "";
            champPublie.checked = !!data.est_publie;

            genresSelectionnesInitialement = Array.isArray(data.genres) ? data.genres : [];

            mettreAJourApercuPoster();

            if (titrePage) {
                titrePage.innerHTML = `<i class="fa-solid fa-film" style="color: var(--rouge-mada); margin-right: 8px;"></i> Modifier « ${data.titre} »`;
            }
            if (btnEnregistrer) {
                btnEnregistrer.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Enregistrer les modifications';
            }

        } catch (error) {
            console.error("Erreur chargement film", error);
            showMessage("error", "Erreur serveur lors du chargement du film");
        }
    }

    // =========================
    // Test de la vidéo
    // =========================

    if (btnTesterVideo) {
        btnTesterVideo.addEventListener("click", () => {
            const chemin = champVideo.value.trim();

            if (!chemin) {
                statutTestVideo.textContent = "Renseigne d'abord un chemin de fichier vidéo.";
                statutTestVideo.className = "statut-test-video erreur";
                return;
            }

            statutTestVideo.textContent = "Chargement de la vidéo...";
            statutTestVideo.className = "statut-test-video chargement";
            cadreVideoTest.style.display = "block";

            videoTest.src = chemin;
            videoTest.load();
        });
    }

    if (videoTest) {
        videoTest.addEventListener("loadeddata", () => {
            statutTestVideo.textContent = "La vidéo se charge correctement.";
            statutTestVideo.className = "statut-test-video succes";
        });

        videoTest.addEventListener("error", () => {
            statutTestVideo.textContent = "Impossible de lire ce fichier (chemin incorrect ou fichier absent).";
            statutTestVideo.className = "statut-test-video erreur";
        });
    }

    // =========================
    // Soumission du formulaire (création ou édition)
    // =========================

    if (formFilm) {
        formFilm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const genres = genresSelectionnes();

            const autreGenre = champAutreGenre.value
                .split(",")
                .map(g => g.trim())
                .filter(Boolean);

            const payload = {
                titre: champTitre.value.trim(),
                realisateur: champRealisateur.value.trim(),
                synopsis: champSynopsis.value.trim(),
                duree_minutes: parseInt(champDuree.value, 10),
                annee_sortie: parseInt(champAnnee.value, 10),
                poster: champAffiche.value.trim(),
                url_trailer: champTrailer.value.trim() || null,
                video_path: champVideo.value.trim() || null,
                genres: [...genres, ...autreGenre],
                est_publie: champPublie.checked ? 1 : 0
            };

            if (!payload.genres.length) {
                showMessage("error", "Sélectionne au moins un genre");
                return;
            }

            const texteOriginal = btnEnregistrer.innerHTML;
            btnEnregistrer.disabled = true;
            btnEnregistrer.textContent = "Enregistrement...";

            try {
                const reponse = modeEdition
                    ? await api.updateFilm(idFilm, payload)
                    : await api.createFilm(payload);

                if (reponse.success) {
                    showMessage("success", reponse.message || (modeEdition ? "Film modifié" : "Film créé"));
                    setTimeout(() => {
                        window.location.href = "/movie/public/index.php?action=admin-films";
                    }, 900);
                } else {
                    showMessage("error", reponse.message || "Une erreur est survenue");
                }

            } catch (error) {
                console.error("Erreur enregistrement film", error);
                showMessage("error", "Erreur serveur");
            } finally {
                btnEnregistrer.disabled = false;
                btnEnregistrer.innerHTML = texteOriginal;
            }
        });
    }

    // =========================
    // Initialisation
    // =========================

    await chargerAdmin();

    if (modeEdition) {
        await chargerFilmExistant();
    }

    await chargerGenres();

});