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

    // ==================================================
    // Gestion de l'état du formulaire
    // ==================================================

    let initialValues = {};

    const form = document.getElementById("formulaireProfilAdmin");
    const button = document.getElementById("submitProfile");

    if (button) {
        button.disabled = true;
    }

    function verifierModification() {
        if (!form || !button) return;

        const currentValues = {
            nom: document.getElementById("nomUtilisateurAdmin").value.trim(),
            email: document.getElementById("emailAdmin").value.trim(),
            mdp: document.getElementById("nouveauMdpAdmin").value,
            confirmation: document.getElementById("confirmerMdpAdmin").value
        };

        const modifie =
            currentValues.nom !== initialValues.nom ||
            currentValues.email !== initialValues.email ||
            currentValues.mdp !== initialValues.mdp ||
            currentValues.confirmation !== initialValues.confirmation;

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

    function injectAdmin(user) {
        const nomAdminConnecte = document.getElementById("nomAdminConnecte");
        const nomUtilisateur = document.getElementById("nomUtilisateurAdmin");
        const email = document.getElementById("emailAdmin");

        if (nomAdminConnecte) nomAdminConnecte.textContent = user.nom_utilisateur;
        if (nomUtilisateur) nomUtilisateur.value = user.nom_utilisateur;
        if (email) email.value = user.email;

        // Sauvegarde des valeurs initiales
        initialValues = {
            nom: user.nom_utilisateur,
            email: user.email,
            mdp: "",
            confirmation: ""
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

            const formData = new FormData();
            formData.append("nom_utilisateur", nomUtilisateur);
            formData.append("email", email);
            formData.append("nouveau_mdp", nouveauMdp);
            formData.append("confirmer_mdp", confirmerMdp);

            try {
                const { success, message, user } = await api.updateProfile(formData);

                if (success) {
                    showMessage("success", message);

                    document.getElementById("nouveauMdpAdmin").value = "";
                    document.getElementById("confirmerMdpAdmin").value = "";

                    if (user) {
                        injectAdmin(user);
                    }

                } else {
                    showMessage("error", message);
                }

            } catch (error) {
                console.error(error);
                showMessage("error", "Erreur lors de l'enregistrement");
            }
        });
    }    function injectAdminIdentity(user) {
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
            injectAdmin(user)

        } catch (error) {
            console.error("Erreur chargement identité admin", error);
        }
    }

    await chargerAdmin();

});