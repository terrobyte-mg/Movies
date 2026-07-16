document.addEventListener("DOMContentLoaded", async () => {
    const imageProfilParDefaut = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150";
    const placeholderBase = "https://via.placeholder.com/300x450/1a1a2e/ffffff?text=";

    if (typeof api === "undefined") {
        console.error("API client introuvable (api.js n'est pas chargé)");
        return;
    }

    // ---------------------------------------------------------------
    // Helpers (repris des mêmes conventions que utilisateur.js)
    // ---------------------------------------------------------------
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const safeServerMessage = (message, fallback) => escapeHtml(message || fallback);

    const sanitizeAssetUrl = (value, fallback = imageProfilParDefaut) => {
        const raw = String(value ?? "").trim();
        if (!raw) return fallback;
        if (raw.startsWith("/")) return raw;
        try {
            const parsed = new URL(raw, window.location.origin);
            if (["http:", "https:", "blob:"].includes(parsed.protocol)) {
                return parsed.href;
            }
        } catch {
            return fallback;
        }
        return fallback;
    };

    const safePoster = (film) => {
        const titre = film?.titre ?? "Film";
        return sanitizeAssetUrl(film?.poster, `${placeholderBase}${encodeURIComponent(titre)}`);
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return "";
        try {
            const date = new Date(isoDate.replace(" ", "T"));
            return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return "";
        }
    };

    const formatTemps = (secondes) => {
        if (!Number.isFinite(secondes)) return "00:00";
        const total = Math.max(0, Math.floor(secondes));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        const pad = (n) => String(n).padStart(2, "0");
        return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    };

    // ---------------------------------------------------------------
    // Contexte : id du film depuis l'URL (film.html?id=42)
    // ---------------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    const filmId = Number(params.get("id"));

    if (!filmId) {
        document.getElementById("fpTitre").textContent = "Film introuvable";
        document.getElementById("fpSynopsis").textContent = "Aucun identifiant de film n'a été fourni dans l'URL.";
        return;
    }

    let currentUser = null;
    let currentFilm = null;
    let noteSelectionnee = ((await api.getRateFilm(filmId)));
    console.log(noteSelectionnee.data)

    // ---------------------------------------------------------------
    // Utilisateur connecté
    // ---------------------------------------------------------------
    async function loadUser() {
        try {
            const { success, user } = await api.getCurrentUser();
            if (success && user) {
                currentUser = user;
                const nom = document.getElementById("fpNomUtilisateur");
                const avatar = document.getElementById("fpAvatarUtilisateur");
                if (nom) nom.textContent = user.nom_utilisateur;
                if (avatar) avatar.src = sanitizeAssetUrl(user.url_photo_profil, imageProfilParDefaut);
            }
        } catch (error) {
            console.error("Erreur chargement utilisateur", error);
        }
    }

    // ---------------------------------------------------------------
    // Chargement + affichage du film
    // ---------------------------------------------------------------
    async function loadFilm() {
        try {
            const { success, data } = await api.getFilm(filmId);
            if (!success || !data) {
                showMessage("error", "Film introuvable");
                document.getElementById("fpTitre").textContent = "Film introuvable";
                document.getElementById("fpSynopsis").textContent = "Ce film n'existe pas ou n'est plus disponible.";
                return;
            }

            currentFilm = data;
            console.log(data);
            renderFilm(data);
            await renderSimilaires(data);
        } catch (error) {
            console.error(error);
            showMessage("error", "Impossible de charger le film");
        }
    }

    function renderFilm(film) {
        document.title = `${film.titre} - Movies`;

        document.getElementById("fpTitre").textContent = film.titre;
        document.getElementById("fpAnnee").textContent = film.annee_sortie;
        document.getElementById("fpDuree").textContent = film.duree_formatee || "-";
        document.getElementById("fpSynopsis").textContent = film.synopsis || "Synopsis indisponible.";
        document.getElementById("fpRealisateur").textContent = film.realisateur || "-";
        document.getElementById("fpAnneeDetail").textContent = film.annee_sortie || "-";
        document.getElementById("fpDureeDetail").textContent = film.duree_formatee || "-";
        document.getElementById("fpVues").textContent = (film.nombre_vues ?? 0).toLocaleString("fr-FR");
        document.getElementById("fpAffiche").src = safePoster(film);
        document.getElementById("fpAffiche").alt = film.titre;

        const genres = Array.isArray(film.genres) && film.genres.length ? film.genres : [film.genre_principal].filter(Boolean);
        document.getElementById("fpGenres").innerHTML = genres.map((g) => `<span class="badge badge-vert">${escapeHtml(g)}</span>`).join(" ") || "-";
        document.getElementById("fpGenresDetail").textContent = genres.length ? genres.join(", ") : "-";

        const note = Number(film.note_moyenne) || 0;
        document.getElementById("fpNoteInline").textContent = note ? note.toFixed(1) : "-";
        document.getElementById("fpNoteMoyenneValeur").textContent = note ? note.toFixed(1) : "-";
        document.getElementById("fpNombreNotes").textContent = `${film.nombre_notes || 0} avis`;

        // Backdrop du hero = affiche du film (flouté visuellement par le voile en dégradé)
        const hero = document.getElementById("fpHero");
        hero.style.backgroundImage = `url('${safePoster(film)}')`;

        // Lecteur vidéo
        const video = document.getElementById("fpVideo");
        video.poster = safePoster(film);
        if (film.video_path) {
            video.src = film.video_path;
        }

        console.log(film)
        console.log(film.video_path)

        // Bande-annonce
        const btnTrailer = document.getElementById("fpBtnTrailer");
        if (film.url_trailer) {
            btnTrailer.addEventListener("click", () => window.open(film.url_trailer, "_blank", "noopener"));
        } else {
            btnTrailer.disabled = true;
            btnTrailer.title = "Pas de bande-annonce disponible";
            btnTrailer.style.opacity = "0.4";
        }

        const btnFavori = document.getElementById("fpBtnFavori");
        if (btnFavori) {
            const estFavori = !!film.est_favori;
            btnFavori.classList.toggle("fp-actif", estFavori);
            btnFavori.innerHTML = estFavori
                ? '<i class="fa-solid fa-heart"></i>'
                : '<i class="fa-regular fa-heart"></i>';
        }

        renderEtoiles(0);
    }

    // ---------------------------------------------------------------
    // Lecteur vidéo (contrôles)
    // ---------------------------------------------------------------
    function initPlayer() {
        const video = document.getElementById("fpVideo");
        const cadre = document.getElementById("fpPlayerCadre");
        const playCentral = document.getElementById("fpPlayCentral");
        const btnPlayPause = document.getElementById("fpBtnPlayPause");
        const btnReculer = document.getElementById("fpBtnReculer");
        const btnAvancer = document.getElementById("fpBtnAvancer");
        const btnVolume = document.getElementById("fpBtnVolume");
        const btnPleinEcran = document.getElementById("fpBtnPleinEcran");
        const barre = document.getElementById("fpBarreProgression");
        const remplissage = document.getElementById("fpBarreProgressionRemplissage");
        const temps = document.getElementById("fpTemps");

        const togglePlay = () => {
            if (!video.src) {
                showMessage("error", "Aucune vidéo disponible pour ce film " + video.src);
                return;
            }
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        };

        const syncIcones = () => {
            const icone = video.paused ? "fa-play" : "fa-pause";
            playCentral.innerHTML = `<i class="fa-solid ${icone}"></i>`;
            btnPlayPause.className = `fa-solid ${icone}`;
            playCentral.style.display = video.paused ? "flex" : "none";
        };

        playCentral.addEventListener("click", togglePlay);
        btnPlayPause.addEventListener("click", togglePlay);
        video.addEventListener("click", togglePlay);
        video.addEventListener("play", syncIcones);
        video.addEventListener("pause", syncIcones);

        btnReculer.addEventListener("click", () => { video.currentTime = Math.max(0, video.currentTime - 10); });
        btnAvancer.addEventListener("click", () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); });

        btnVolume.addEventListener("click", () => {
            video.muted = !video.muted;
            btnVolume.className = video.muted ? "fa-solid fa-volume-mute" : "fa-solid fa-volume-high";
        });

        btnPleinEcran.addEventListener("click", () => {
            if (cadre.requestFullscreen) cadre.requestFullscreen();
        });

        video.addEventListener("timeupdate", () => {
            const pourcentage = video.duration ? (video.currentTime / video.duration) * 100 : 0;
            remplissage.style.width = `${pourcentage}%`;
            temps.textContent = `${formatTemps(video.currentTime)} / ${formatTemps(video.duration)}`;
        });

        barre.addEventListener("click", (e) => {
            const rect = barre.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            if (video.duration) {
                video.currentTime = ratio * video.duration;
            }
        });

        document.getElementById("fpBtnRegarder").addEventListener("click", () => {
            document.getElementById("fpPlayerCadre").scrollIntoView({ behavior: "smooth", block: "center" });
            togglePlay();
        });

        syncIcones();
    }

    // ---------------------------------------------------------------
    // Favoris (bascule visuelle - à relier à l'API favoris si besoin)
    // ---------------------------------------------------------------
    function initFavoris() {
        const btn = document.getElementById("fpBtnFavori");
        btn.addEventListener("click", async () => {
            if (!currentUser) {
                showMessage("error", "Connectez-vous pour ajouter ce film à vos favoris");
                return;
            }
            try {
                if (typeof api.toggleFavori === "function") {
                    const { success, favori } = await api.toggleFavori(filmId);
                    if (success) {
                        btn.classList.toggle("fp-actif", !!favori);
                        btn.innerHTML = favori
                            ? '<i class="fa-solid fa-heart"></i>'
                            : '<i class="fa-regular fa-heart"></i>';
                        showMessage("success", favori ? "Ajouté aux favoris" : "Retiré des favoris");
                    }
                } else {
                    btn.classList.toggle("fp-actif");
                    const actif = btn.classList.contains("fp-actif");
                    btn.innerHTML = actif ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
                }
            } catch {
                showMessage("error", "Impossible de mettre à jour les favoris");
            }
        });

        document.getElementById("fpBtnPartager").addEventListener("click", async () => {
            const url = window.location.href;
            try {
                await navigator.clipboard.writeText(url);
                showMessage("success", "Lien copié dans le presse-papiers");
            } catch {
                showMessage("error", "Impossible de copier le lien");
            }
        });
    }

    // ---------------------------------------------------------------
    // Notation par étoiles
    // ---------------------------------------------------------------
    function renderEtoiles(survol) {
        const etoiles = document.querySelectorAll("#fpEtoilesInteractives i");
        etoiles.forEach((etoile) => {
            const valeur = Number(etoile.dataset.valeur);
            etoile.classList.toggle("fp-survol", survol > 0 && valeur <= survol);
            etoile.classList.toggle("fp-selection", noteSelectionnee > 0 && valeur <= noteSelectionnee && survol === 0);
        });
    }

    function initNotation() {
        const conteneur = document.getElementById("fpEtoilesInteractives");
        const label = document.getElementById("fpMonAvisLabel");

        conteneur.querySelectorAll("i").forEach((etoile) => {
            const valeur = Number(etoile.dataset.valeur);

            etoile.addEventListener("mouseenter", () => renderEtoiles(valeur));
            etoile.addEventListener("mouseleave", () => renderEtoiles(0));

            etoile.addEventListener("click", async () => {
                if (!currentUser) {
                    showMessage("error", "Connectez-vous pour noter ce film");
                    return;
                }

                try {
                    const { success, message } = await api.rateFilm(filmId, valeur);
                    if (success) {
                        noteSelectionnee = valeur;
                        label.textContent = `Vous avez donné ${valeur}/5`;
                        renderEtoiles(noteSelectionnee.data);
                        const { success: okRefresh, data } = await api.getFilm(filmId);
                        if (okRefresh && data) {
                            renderFilm(data);
                        }
                        showMessage("success", safeServerMessage(message, "Note enregistrée"));
                    } else {
                        showMessage("error", safeServerMessage(message, "Erreur lors de la notation"));
                    }
                } catch {
                    showMessage("error", "Impossible d'enregistrer votre note");
                }
            });
        });
    }

    // ---------------------------------------------------------------
    // Commentaires
    // ---------------------------------------------------------------
    function renderCommentaires(commentaires) {
        const conteneur = document.getElementById("fpListeCommentaires");
        document.getElementById("fpNombreCommentaires").textContent = commentaires.length;

        if (commentaires.length === 0) {
            conteneur.innerHTML = "<p class='fp-vide'>Aucun commentaire pour l'instant. Soyez le premier à donner votre avis !</p>";
            return;
        }

        conteneur.innerHTML = commentaires.map((c) => {
            const estAuteur = currentUser && Number(currentUser.id) === Number(c.utilisateur_id);
            const estAdmin = currentUser && currentUser.role_utilisateur === "admin";
            const peutSupprimer = estAuteur || estAdmin;

            return `
                <div class="fp-commentaire-item" data-comment-id="${c.id}">
                    <img class="fp-commentaire-avatar" src="${sanitizeAssetUrl(c.url_photo_profil, imageProfilParDefaut)}" alt="${escapeHtml(c.nom_utilisateur)}">
                    <div class="fp-commentaire-corps">
                        <div class="fp-commentaire-entete">
                            <span class="fp-commentaire-auteur">${escapeHtml(c.nom_utilisateur)}</span>
                            <span class="fp-commentaire-date">${formatDate(c.created_at)}</span>
                            ${peutSupprimer ? `<button class="fp-commentaire-supprimer" data-comment-id="${c.id}"><i class="fa-solid fa-trash"></i></button>` : ""}
                        </div>
                        <p class="fp-commentaire-texte">${escapeHtml(c.commentaire)}</p>
                    </div>
                </div>
            `;
        }).join("");

        conteneur.querySelectorAll(".fp-commentaire-supprimer").forEach((btn) => {
            btn.addEventListener("click", () => supprimerCommentaire(Number(btn.dataset.commentId)));
        });
    }

    async function chargerCommentaires() {
        try {
            const { success, data } = await api.getFilmComments(filmId);
            renderCommentaires(success && Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erreur chargement commentaires", error);
            document.getElementById("fpListeCommentaires").innerHTML =
                "<p class='fp-vide'>Impossible de charger les commentaires pour le moment.</p>";
        }
    }

    async function supprimerCommentaire(commentId) {
        try {
            const { success, message } = await api.deleteFilmComment(commentId);
            if (success) {
                showMessage("success", safeServerMessage(message, "Commentaire supprimé"));
                await chargerCommentaires();
            } else {
                showMessage("error", safeServerMessage(message, "Suppression impossible"));
            }
        } catch {
            showMessage("error", "Erreur lors de la suppression");
        }
    }

    function initFormulaireCommentaire() {
        const form = document.getElementById("fpFormCommentaire");
        const textarea = document.getElementById("fpTexteCommentaire");
        const bouton = form.querySelector("button");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!currentUser) {
                showMessage("error", "Connectez-vous pour laisser un commentaire");
                return;
            }

            const texte = textarea.value.trim();
            if (!texte) {
                showMessage("error", "Le commentaire ne peut pas être vide");
                return;
            }
            if (texte.length > 1000) {
                showMessage("error", "Le commentaire est trop long (1000 caractères max)");
                return;
            }

            bouton.disabled = true;
            try {
                const { success, message } = await api.addFilmComment(filmId, texte);
                if (success) {
                    textarea.value = "";
                    showMessage("success", safeServerMessage(message, "Commentaire publié"));
                    await chargerCommentaires();
                } else {
                    showMessage("error", safeServerMessage(message, "Erreur lors de la publication"));
                }
            } catch {
                showMessage("error", "Impossible de publier votre commentaire");
            } finally {
                bouton.disabled = false;
            }
        });
    }

    // ---------------------------------------------------------------
    // Films similaires
    // ---------------------------------------------------------------
    async function renderSimilaires(film) {
        const conteneur = document.getElementById("fpGrilleSimilaires");
        try {
            const genre = film.genre_principal;
            const { success, data } = await api.getFilms({ genre, sort: "recent", limit: 8 });
            const similaires = (success && Array.isArray(data) ? data : []).filter((f) => f.id !== film.id);

            if (similaires.length === 0) {
                conteneur.innerHTML = "<p class='fp-vide'>Pas de suggestion pour l'instant.</p>";
                return;
            }

            conteneur.innerHTML = similaires.slice(0, 6).map((f) => `
                <a class="carte-film" href="/movie/public/index.php?action=voir-film&id=${f.id}">
                    <div class="film-affiche-conteneur">
                        <img class="film-affiche" src="${safePoster(f)}" alt="${escapeHtml(f.titre)}" loading="lazy">
                    </div>
                    <div class="film-infos">
                        <h4>${escapeHtml(f.titre)}</h4>
                        <p>${escapeHtml(f.genre_principal || "-")} · ${f.annee_sortie}</p>
                    </div>
                </a>
            `).join("");
        } catch (error) {
            console.error("Erreur films similaires", error);
        }
    }

    // ---------------------------------------------------------------
    // Initialisation
    // ---------------------------------------------------------------
    await loadUser();
    await loadFilm();
    initPlayer();
    initFavoris();
    initNotation();
    renderEtoiles(noteSelectionnee.data);
    initFormulaireCommentaire();
    await chargerCommentaires();
});