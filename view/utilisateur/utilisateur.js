document.addEventListener("DOMContentLoaded", async () => {

    // =========================
    // 1. LOGOUT
    // =========================
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

                } else {
                    showMessage("error", message);
                }

            } catch (error) {
                showMessage("error", "Erreur serveur");
            }
        });
    }

    // =========================
    // 2. CHARGER USER (API PHP)
    // =========================

    async function loadUser() {

        try {
            const { success, user } = await api.getCurrentUser();

            if (!success || !user) {
                console.log("Utilisateur non connecté");
                return;
            }

            injectUser(user);

        } catch (error) {
            console.error("Erreur chargement user", error);
        }
    }

    // =========================
    // 3. INJECTION DOM
    // =========================
    const imageProfilParDefaut = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150";

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

        // Mettre à jour les avatars sur la page
        const avatars = document.querySelectorAll(".avatar-grand, .avatar-petit");
        avatars.forEach(avatar => {
            if (user.url_photo_profil) {
                avatar.src = user.url_photo_profil;
            }
        });

        const apercuPhoto = document.getElementById("apercuPhotoProfil");
        if (apercuPhoto) {
            apercuPhoto.src = user.url_photo_profil || imageProfilParDefaut;
        }
    }

    // =========================
    // 3b. SUBMIT SETTINGS
    // =========================
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
            document.querySelectorAll(".avatar-grand, .avatar-petit").forEach(avatar => {
                avatar.src = urlApercuPhoto;
            });
        });
    }

    if (paramForm) {
        paramForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nomUtilisateur = document.getElementById("nomUtilisateur").value.trim();
            const email = document.getElementById("email").value.trim();
            const nouveauMdp = document.getElementById("nouveauMdp").value;
            const confirmerMdp = document.getElementById("confirmerMdp").value;

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
                    document.getElementById("nouveauMdp").value = "";
                    document.getElementById("confirmerMdp").value = "";
                    if (photoInput) {
                        photoInput.value = ""; // reset file input
                    }
                } else {
                    showMessage("error", message);
                }
            } catch (error) {
                console.error(error);
                showMessage("error", "Erreur lors de l'enregistrement");
            }
        });
    }



    // =========================
    // 4. INIT
    // =========================
    await loadUser();

});