document.addEventListener("DOMContentLoaded", async () => {
    const imageProfilParDefaut = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150";
    const typesImageAutorises = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const tailleImageMax = 2 * 1024 * 1024;
    let urlApercuPhoto = null;
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    const safeServerMessage = (message, fallback) => escapeHtml(message || fallback);

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            try {
                const { success, message, redirect } = await api.logout();

                if (success) {
                    showMessage("success", safeServerMessage(message, "Déconnexion réussie"));

                    setTimeout(() => {
                        window.location.href = redirect;
                    }, 1000);

                } else {
                    showMessage("error", safeServerMessage(message, "Échec de la déconnexion"));
                }

            } catch (error) {
                showMessage("error", "Erreur serveur");
            }
        });
    }

    // ==================================================
    // Gestion de l'état du formulaire
    // ==================================================

    let initialValues = {};

    const form = document.getElementById("formulaireProfilAdmin");
    const button = document.getElementById("submitProfile");
    const photoInput = document.getElementById("photoProfilAdmin");
    const apercuPhoto = document.getElementById("apercuPhotoProfilAdmin");

    if (button) {
        button.disabled = true;
    }

    function verifierModification() {
        if (!form || !button) return;

        const currentValues = {
            nom: document.getElementById("nomUtilisateurAdmin").value.trim(),
            email: document.getElementById("emailAdmin").value.trim(),
            mdp: document.getElementById("nouveauMdpAdmin").value,
            confirmation: document.getElementById("confirmerMdpAdmin").value,
            photo: photoInput?.files?.length > 0
        };

        const modifie =
            currentValues.nom !== initialValues.nom ||
            currentValues.email !== initialValues.email ||
            currentValues.mdp !== initialValues.mdp ||
            currentValues.confirmation !== initialValues.confirmation ||
            currentValues.photo !== initialValues.photo;

        button.disabled = !modifie;
    }

    if (form) {
        [
            "nomUtilisateurAdmin",
            "emailAdmin",
            "nouveauMdpAdmin",
            "confirmerMdpAdmin"
        ].forEach(id => {
            const input = document.getElementById(id);

            if (input) {
                input.addEventListener("input", verifierModification);
            }
        });
    }

    if (photoInput && apercuPhoto) {
        photoInput.addEventListener("change", () => {
            const fichier = photoInput.files[0];

            if (!fichier) {
                if (urlApercuPhoto) {
                    URL.revokeObjectURL(urlApercuPhoto);
                    urlApercuPhoto = null;
                }
                return;
            }

            if (!typesImageAutorises.includes(fichier.type)) {
                showMessage("error", "Format d'image non autorisé");
                photoInput.value = "";
                verifierModification();
                return;
            }

            if (fichier.size > tailleImageMax) {
                showMessage("error", "L'image ne doit pas dépasser 2 Mo");
                photoInput.value = "";
                verifierModification();
                return;
            }

            if (urlApercuPhoto) {
                URL.revokeObjectURL(urlApercuPhoto);
            }

            urlApercuPhoto = URL.createObjectURL(fichier);
            apercuPhoto.src = urlApercuPhoto;
            verifierModification();
        });
    }

    const sanitizeAssetUrl = (value, fallback = imageProfilParDefaut) => {
        const raw = String(value ?? "").trim();
        if (!raw) {
            return fallback;
        }

        if (raw.startsWith("/")) {
            return raw;
        }

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

    function injectAdmin(user) {
        const nomAdminConnecte = document.getElementById("nomAdminConnecte");
        const nomUtilisateur = document.getElementById("nomUtilisateurAdmin");
        const email = document.getElementById("emailAdmin");

        if (nomAdminConnecte) nomAdminConnecte.textContent = user.nom_utilisateur;
        if (nomUtilisateur) nomUtilisateur.value = user.nom_utilisateur;
        if (email) email.value = user.email;
        if (apercuPhoto) apercuPhoto.src = sanitizeAssetUrl(user.url_photo_profil, imageProfilParDefaut);
        if (photoInput) photoInput.value = "";

        // Sauvegarde des valeurs initiales
        initialValues = {
            nom: user.nom_utilisateur,
            email: user.email,
            mdp: "",
            confirmation: "",
            photo: false
        };

        verifierModification();
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nomUtilisateur = document.getElementById("nomUtilisateurAdmin").value.trim();
            const email = document.getElementById("emailAdmin").value.trim();
            const nouveauMdp = document.getElementById("nouveauMdpAdmin").value;
            const confirmerMdp = document.getElementById("confirmerMdpAdmin").value;
            const fichierPhoto = photoInput?.files?.[0] ?? null;

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

            if (fichierPhoto) {
                if (!typesImageAutorises.includes(fichierPhoto.type)) {
                    showMessage("error", "Format d'image non autorisé");
                    return;
                }
                if (fichierPhoto.size > tailleImageMax) {
                    showMessage("error", "L'image ne doit pas dépasser 2 Mo");
                    return;
                }
            }

            const formData = new FormData();
            formData.append("nom_utilisateur", nomUtilisateur);
            formData.append("email", email);
            formData.append("nouveau_mdp", nouveauMdp);
            formData.append("confirmer_mdp", confirmerMdp);
            if (fichierPhoto) {
                formData.append("photo_profil", fichierPhoto);
            }

            try {
                const { success, message, user } = await api.updateProfile(formData);

                if (success) {
                    showMessage("success", safeServerMessage(message, "Profil mis à jour"));

                    document.getElementById("nouveauMdpAdmin").value = "";
                    document.getElementById("confirmerMdpAdmin").value = "";
                    if (photoInput) {
                        photoInput.value = "";
                    }

                    if (user) {
                        injectAdminIdentity(user);
                        injectAdmin(user);
                    }

                } else {
                    showMessage("error", safeServerMessage(message, "Erreur lors de l'enregistrement"));
                }

            } catch (error) {
                console.error(error);
                showMessage("error", "Erreur lors de l'enregistrement");
            }
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
            avatar.src = sanitizeAssetUrl(user.url_photo_profil, imageProfilParDefaut);
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
            injectAdmin(user)

        } catch (error) {
            console.error("Erreur chargement identité admin", error);
        }
    }

    await chargerAdmin();

});