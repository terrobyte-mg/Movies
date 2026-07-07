document.addEventListener("DOMContentLoaded", async () => {
    const imageProfilParDefaut = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150";
    const placeholderBase = "https://via.placeholder.com/160x230/1a1a2e/ffffff?text=";

    if (typeof api === "undefined") {
        console.error("API client introuvable");
        return;
    }

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const safePoster = (film) => {
        const titre = film?.titre ?? "Film";
        return film?.poster || `${placeholderBase}${encodeURIComponent(titre)}`;
    };

    const formatNote = (film) => {
        if (!film?.note_moyenne) {
            return "-";
        }
        return Number(film.note_moyenne).toFixed(1);
    };

    const filmsState = {
        home: [],
        categoryFilms: [],
        dateFilms: []
    };

    const logoutBtn = document.getElementById("logoutButton");
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
                    return;
                }
                showMessage("error", message || "Échec de la déconnexion");
            } catch {
                showMessage("error", "Erreur serveur");
            }
        });
    }

    function injectUser(user) {
        const nomSidebar = document.getElementById("nomUtilisateurConnecte");
        const nomHeader = document.querySelector(".profil-utilisateur span");

        if (nomSidebar) {
            nomSidebar.textContent = user.nom_utilisateur;
        }

        if (nomHeader) {
            nomHeader.textContent = user.nom_utilisateur;
        }

        const inputNom = document.getElementById("nomUtilisateur");
        const inputEmail = document.getElementById("email");
        if (inputNom) {
            inputNom.value = user.nom_utilisateur;
        }
        if (inputEmail) {
            inputEmail.value = user.email;
        }

        document.querySelectorAll(".avatar-grand, .avatar-petit").forEach((avatar) => {
            avatar.src = user.url_photo_profil || imageProfilParDefaut;
        });

        const apercuPhoto = document.getElementById("apercuPhotoProfil");
        if (apercuPhoto) {
            apercuPhoto.src = user.url_photo_profil || imageProfilParDefaut;
        }
    }

    async function loadUser() {
        try {
            const { success, user } = await api.getCurrentUser();
            if (success && user) {
                injectUser(user);
            }
        } catch (error) {
            console.error("Erreur chargement user", error);
        }
    }

    async function fetchFilms(filters = {}) {
        const response = await api.getFilms(filters);
        if (!response?.success || !Array.isArray(response.data)) {
            return [];
        }
        return response.data;
    }

    function renderHomeGrid() {
        const conteneur = document.getElementById("grilleFilmsANePasManquer");
        if (!conteneur) {
            return;
        }

        if (filmsState.home.length === 0) {
            conteneur.innerHTML = "<p style='color:var(--gris-clair);'>Aucun film disponible.</p>";
            return;
        }

        conteneur.innerHTML = filmsState.home.map((film) => `
            <article class="carte-film" data-film-id="${film.id}">
                <div class="film-affiche-conteneur">
                    <img class="film-affiche" src="${safePoster(film)}" alt="${escapeHtml(film.titre)}" loading="lazy">
                </div>
                <div class="film-infos">
                    <h4>${escapeHtml(film.titre)}</h4>
                    <p>${escapeHtml(film.genre_principal || "-" )} · ${film.annee_sortie}</p>
                </div>
            </article>
        `).join("");

        conteneur.querySelectorAll("[data-film-id]").forEach((element) => {
            element.addEventListener("click", () => openFilmDetail(Number(element.dataset.filmId)));
        });
    }

    async function openFilmDetail(id) {
        if (!id) {
            return;
        }

        const fiche = document.getElementById("vueUtilisateurFicheFilm");
        const catalogue = document.getElementById("vueUtilisateurCatalogue");
        if (!fiche || !catalogue) {
            return;
        }

        try {
            const { success, data } = await api.getFilm(id);
            if (!success || !data) {
                showMessage("error", "Film introuvable");
                return;
            }

            document.getElementById("ficheTitreFilm").textContent = data.titre;
            document.getElementById("ficheAnneeFilm").textContent = data.annee_sortie;
            document.getElementById("ficheGenreFilm").textContent = data.genre_principal || "-";
            document.getElementById("ficheDureeFilm").textContent = data.duree_formatee || "-";
            document.getElementById("ficheSynopsisFilm").textContent = data.synopsis || "Synopsis indisponible";
            document.getElementById("ficheRealFilm").textContent = data.realisateur || "-";
            document.getElementById("ficheDateSortieFilm").textContent = data.annee_sortie;
            document.getElementById("ficheAfficheFilm").src = safePoster(data);
            document.getElementById("ficheNoteFilm").innerHTML = `${formatNote(data)}<span>/10</span>`;
            document.getElementById("ficheAvisFilm").textContent = `${data.nombre_notes || 0} avis`;
            document.getElementById("banniereFilmTitre").textContent = data.titre;
            document.getElementById("banniereFilmDesc").textContent = data.synopsis || "";
            document.getElementById("banniereFilmImg").src = safePoster(data);
            document.getElementById("lecteurFilmTitreEnCours").textContent = data.titre;

            const video = document.getElementById("baliseLecteurVideo");
            if (video) {
                video.poster = safePoster(data);
                if (data.video_path) {
                    video.src = data.video_path;
                }
            }

            fiche.classList.remove("masque");
            catalogue.classList.add("masque");
        } catch {
            showMessage("error", "Impossible de charger le film");
        }
    }

    async function initHomePage() {
        const conteneur = document.getElementById("grilleFilmsANePasManquer");
        if (!conteneur) {
            return;
        }

        filmsState.home = await fetchFilms({ sort: "views", limit: 12 });
        renderHomeGrid();

        if (filmsState.home[0]) {
            const film = filmsState.home[0];
            const banniereTitre = document.getElementById("banniereFilmTitre");
            const banniereDesc = document.getElementById("banniereFilmDesc");
            const banniereImage = document.getElementById("banniereFilmImg");
            if (banniereTitre) banniereTitre.textContent = film.titre;
            if (banniereDesc) banniereDesc.textContent = film.synopsis || "";
            if (banniereImage) banniereImage.src = safePoster(film);
        }

        const retourBtn = document.querySelector("#vueUtilisateurFicheFilm .bouton-voir-plus");
        const fiche = document.getElementById("vueUtilisateurFicheFilm");
        const catalogue = document.getElementById("vueUtilisateurCatalogue");
        if (retourBtn && fiche && catalogue) {
            retourBtn.addEventListener("click", () => {
                fiche.classList.add("masque");
                catalogue.classList.remove("masque");
            });
        }
    }

    function renderGenreFilms(films) {
        const conteneur = document.getElementById("grilleFilms");
        if (!conteneur) {
            return;
        }

        if (films.length === 0) {
            conteneur.innerHTML = "<p style='color:var(--gris-clair);'>Aucun film pour ce genre.</p>";
            return;
        }

        conteneur.innerHTML = films.map((film) => `
            <div class="carte-film" data-film-id="${film.id}">
                <img src="${safePoster(film)}" alt="${escapeHtml(film.titre)}" loading="lazy">
                <div class="info-film">
                    <h4>${escapeHtml(film.titre)}</h4>
                    <span><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${film.annee_sortie}</span>
                </div>
            </div>
        `).join("");
    }

    async function initGenrePage() {
        const grilleGenres = document.getElementById("grilleGenres");
        const grilleFilms = document.getElementById("grilleFilms");
        if (!grilleGenres || !grilleFilms) {
            return;
        }

        const setGenre = async (genre, element) => {
            document.querySelectorAll("#grilleGenres .carte-genre").forEach((card) => card.classList.remove("actif"));
            if (element) {
                element.classList.add("actif");
            }
            const genreTitre = document.getElementById("genreSelectionne");
            if (genreTitre) {
                genreTitre.textContent = genre;
            }
            const films = await fetchFilms({ genre, sort: "recent", limit: 60 });
            renderGenreFilms(films);
            applyGenreSearchFilter();
        };

        const cards = Array.from(grilleGenres.querySelectorAll(".carte-genre"));
        cards.forEach((card) => {
            const label = card.querySelector("span")?.textContent?.trim();
            card.dataset.genre = label || "";
            card.addEventListener("click", () => setGenre(card.dataset.genre, card));
        });

        const firstActive = cards.find((card) => card.classList.contains("actif")) || cards[0];
        if (firstActive?.dataset.genre) {
            await setGenre(firstActive.dataset.genre, firstActive);
        }

        const champRecherche = document.getElementById("champRecherche");
        if (champRecherche) {
            champRecherche.addEventListener("input", applyGenreSearchFilter);
        }
    }

    function applyGenreSearchFilter() {
        const champRecherche = document.getElementById("champRecherche");
        const valeur = (champRecherche?.value || "").toLowerCase();
        document.querySelectorAll("#grilleFilms .carte-film").forEach((carte) => {
            const titre = carte.querySelector("h4")?.textContent?.toLowerCase() || "";
            carte.style.display = titre.includes(valeur) ? "" : "none";
        });
    }

    function renderCategoryGrid(category) {
        const conteneur = document.getElementById("grilleContenu");
        if (!conteneur) {
            return;
        }

        if (category !== "films") {
            conteneur.innerHTML = `<p style='color:var(--gris-clair);'>Aucun ${category === "series" ? "série" : "animé"} disponible pour l'instant.</p>`;
            return;
        }

        if (filmsState.categoryFilms.length === 0) {
            conteneur.innerHTML = "<p style='color:var(--gris-clair);'>Aucun film disponible.</p>";
            return;
        }

        conteneur.innerHTML = filmsState.categoryFilms.map((film) => `
            <div class="carte-contenu">
                <img src="${safePoster(film)}" alt="${escapeHtml(film.titre)}" loading="lazy">
                <div class="badge-type">Film</div>
                <div class="info-contenu">
                    <h4>${escapeHtml(film.titre)}</h4>
                    <span><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${film.annee_sortie}</span>
                </div>
            </div>
        `).join("");

        applyCategorySearchFilter();
    }

    function applyCategorySearchFilter() {
        const input = document.getElementById("champRecherche");
        const value = (input?.value || "").toLowerCase();

        document.querySelectorAll("#grilleContenu .carte-contenu").forEach((carte) => {
            const titre = carte.querySelector("h4")?.textContent?.toLowerCase() || "";
            carte.style.display = titre.includes(value) ? "" : "none";
        });
    }

    async function initCategoryPage() {
        const conteneur = document.getElementById("grilleContenu");
        if (!conteneur) {
            return;
        }

        filmsState.categoryFilms = await fetchFilms({ sort: "recent", limit: 100 });

        const chiffres = document.querySelectorAll(".stats-categorie .stat-item .chiffre");
        if (chiffres[0]) chiffres[0].textContent = filmsState.categoryFilms.length;
        if (chiffres[1]) chiffres[1].textContent = "0";
        if (chiffres[2]) chiffres[2].textContent = "0";

        const setCategory = (category) => {
            document.querySelectorAll(".onglet-categorie").forEach((btn) => btn.classList.remove("actif"));
            document.getElementById(`onglet${category.charAt(0).toUpperCase()}${category.slice(1)}`)?.classList.add("actif");
            renderCategoryGrid(category);
        };

        document.getElementById("ongletFilms")?.addEventListener("click", () => setCategory("films"));
        document.getElementById("ongletSeries")?.addEventListener("click", () => setCategory("series"));
        document.getElementById("ongletAnimes")?.addEventListener("click", () => setCategory("animes"));

        document.getElementById("champRecherche")?.addEventListener("input", applyCategorySearchFilter);

        setCategory("films");
    }

    function sortDateFilms(films, sort) {
        const copy = [...films];
        if (sort === "ancien") {
            return copy.sort((a, b) => a.annee_sortie - b.annee_sortie || a.titre.localeCompare(b.titre));
        }
        if (sort === "titre") {
            return copy.sort((a, b) => a.titre.localeCompare(b.titre));
        }
        return copy.sort((a, b) => b.annee_sortie - a.annee_sortie || a.titre.localeCompare(b.titre));
    }

    function renderDateGrid(activeYear = "Tous") {
        const conteneur = document.getElementById("grilleFilmsDate");
        if (!conteneur) {
            return;
        }

        const search = (document.getElementById("champRecherche")?.value || "").toLowerCase();
        const sort = document.getElementById("selectTri")?.value || "recent";

        let filtered = activeYear === "Tous"
            ? [...filmsState.dateFilms]
            : filmsState.dateFilms.filter((film) => String(film.annee_sortie) === String(activeYear));

        filtered = filtered.filter((film) => film.titre.toLowerCase().includes(search));
        filtered = sortDateFilms(filtered, sort);

        const compteur = document.getElementById("compteurFilms");
        if (compteur) {
            compteur.textContent = String(filtered.length);
        }

        if (filtered.length === 0) {
            conteneur.innerHTML = "<p style='color:var(--gris-clair);'>Aucun film trouvé.</p>";
            return;
        }

        conteneur.innerHTML = filtered.map((film) => `
            <div class="carte-film-date">
                <img src="${safePoster(film)}" alt="${escapeHtml(film.titre)}" loading="lazy">
                <div class="info-film-date">
                    <h4>${escapeHtml(film.titre)}</h4>
                    <span class="annee-badge"><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${film.annee_sortie}</span>
                </div>
            </div>
        `).join("");
    }

    function renderDateYears(selectedYear = "Tous") {
        const timeline = document.getElementById("timelineAnnees");
        if (!timeline) {
            return;
        }

        const years = [...new Set(filmsState.dateFilms.map((film) => film.annee_sortie))].sort((a, b) => b - a);
        const allYears = ["Tous", ...years];

        timeline.innerHTML = allYears.map((annee) => `
            <button type="button" class="bouton-annee ${String(annee) === String(selectedYear) ? "actif" : ""}" data-annee="${annee}">
                ${annee === "Tous" ? '<i class="fa-solid fa-infinity" style="margin-right:6px;"></i>Tous' : annee}
            </button>
        `).join("");
    }

    async function initDatePage() {
        const timeline = document.getElementById("timelineAnnees");
        if (!timeline) {
            return;
        }

        filmsState.dateFilms = await fetchFilms({ sort: "recent", limit: 100 });
        let selectedYear = "Tous";

        const refresh = () => {
            renderDateYears(selectedYear);
            renderDateGrid(selectedYear);
            timeline.querySelectorAll(".bouton-annee").forEach((button) => {
                button.addEventListener("click", () => {
                    selectedYear = button.dataset.annee;
                    refresh();
                });
            });
        };

        document.getElementById("selectTri")?.addEventListener("change", () => renderDateGrid(selectedYear));
        document.getElementById("champRecherche")?.addEventListener("input", () => renderDateGrid(selectedYear));

        refresh();
    }

    function initSettingsForm() {
        const paramForm = document.getElementById("formulaireParametres");
        const photoInput = document.getElementById("photoProfil");
        const apercuPhoto = document.getElementById("apercuPhotoProfil");
        const typesImageAutorises = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        let urlApercuPhoto = null;

        if (photoInput && apercuPhoto) {
            photoInput.addEventListener("change", () => {
                const fichier = photoInput.files[0];
                if (!fichier) {
                    return;
                }

                if (!typesImageAutorises.includes(fichier.type)) {
                    showMessage("error", "Format d'image non autorisé");
                    photoInput.value = "";
                    return;
                }

                if (fichier.size > 2 * 1024 * 1024) {
                    showMessage("error", "L'image ne doit pas dépasser 2 Mo");
                    photoInput.value = "";
                    return;
                }

                if (urlApercuPhoto) {
                    URL.revokeObjectURL(urlApercuPhoto);
                }

                urlApercuPhoto = URL.createObjectURL(fichier);
                apercuPhoto.src = urlApercuPhoto;
                document.querySelectorAll(".avatar-grand, .avatar-petit").forEach((avatar) => {
                    avatar.src = urlApercuPhoto;
                });
            });
        }

        if (!paramForm) {
            return;
        }

        paramForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nomUtilisateur = document.getElementById("nomUtilisateur")?.value.trim() || "";
            const email = document.getElementById("email")?.value.trim() || "";
            const nouveauMdp = document.getElementById("nouveauMdp")?.value || "";
            const confirmerMdp = document.getElementById("confirmerMdp")?.value || "";

            if (nomUtilisateur.length < 3 || nomUtilisateur.length > 50) {
                showMessage("error", "Le nom d'utilisateur doit contenir entre 3 et 50 caractères");
                return;
            }

            if (!email || !email.includes("@")) {
                showMessage("error", "Adresse email invalide");
                return;
            }

            if (nouveauMdp && nouveauMdp.length < 8) {
                showMessage("error", "Le mot de passe doit faire au moins 8 caractères");
                return;
            }

            if (nouveauMdp && nouveauMdp !== confirmerMdp) {
                showMessage("error", "Les mots de passe ne correspondent pas");
                return;
            }

            if (photoInput && photoInput.files.length > 0) {
                const fichier = photoInput.files[0];
                if (!typesImageAutorises.includes(fichier.type)) {
                    showMessage("error", "Format d'image non autorisé");
                    return;
                }
                if (fichier.size > 2 * 1024 * 1024) {
                    showMessage("error", "L'image ne doit pas dépasser 2 Mo");
                    return;
                }
            }

            const formData = new FormData();
            formData.append("nom_utilisateur", nomUtilisateur);
            formData.append("email", email);
            formData.append("nouveau_mdp", nouveauMdp);
            formData.append("confirmer_mdp", confirmerMdp);

            if (photoInput && photoInput.files.length > 0) {
                formData.append("photo_profil", photoInput.files[0]);
            }

            try {
                const { success, message, user } = await api.updateProfile(formData);
                if (success) {
                    showMessage("success", message);
                    if (user) {
                        injectUser(user);
                    }
                    const newPwd = document.getElementById("nouveauMdp");
                    const confirmPwd = document.getElementById("confirmerMdp");
                    if (newPwd) newPwd.value = "";
                    if (confirmPwd) confirmPwd.value = "";
                    if (photoInput) {
                        photoInput.value = "";
                    }
                } else {
                    showMessage("error", message || "Erreur lors de la mise à jour");
                }
            } catch (error) {
                console.error(error);
                showMessage("error", "Erreur lors de l'enregistrement");
            }
        });
    }

    window.ouvrirModaleSuppression = function ouvrirModaleSuppression() {
        const modale = document.getElementById("modaleSuppression");
        if (modale) {
            modale.style.display = "flex";
        }
    };

    window.fermerModaleSuppression = function fermerModaleSuppression() {
        const modale = document.getElementById("modaleSuppression");
        const input = document.getElementById("mdpConfirmation");
        if (modale) {
            modale.style.display = "none";
        }
        if (input) {
            input.value = "";
        }
    };

    window.supprimerCompte = async function supprimerCompte() {
        const input = document.getElementById("mdpConfirmation");
        const motDePasse = input?.value?.trim() || "";

        if (!motDePasse) {
            showMessage("error", "Veuillez saisir votre mot de passe");
            return;
        }

        try {
            const { success, message, redirect } = await api.deleteAccount(motDePasse);
            if (success) {
                showMessage("success", message);
                setTimeout(() => {
                    window.location.href = redirect || "/movie/public/index.php?action=login";
                }, 1000);
                return;
            }
            showMessage("error", message || "Suppression impossible");
        } catch {
            showMessage("error", "Erreur serveur");
        }
    };

    await loadUser();
    await initHomePage();
    await initGenrePage();
    await initCategoryPage();
    await initDatePage();
    initSettingsForm();
});
