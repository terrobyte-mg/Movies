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

    async function loadAdmin() {
        try {
            const { success, user } = await api.getCurrentUser();

            if (!success || !user) {
                console.log("Administrateur non connecté");
                return;
            }

            injectAdmin(user);

        } catch (error) {
            console.error("Erreur chargement profil admin", error);
        }
    }

    function injectAdmin(user) {
        const nomAdminConnecte = document.getElementById("nomAdminConnecte");
        const nomComplet = document.getElementById("nomCompletAdmin");
        const nomUtilisateur = document.getElementById("nomUtilisateurAdmin");
        const email = document.getElementById("emailAdmin");

        // Pas de champ "nom complet" côté backend, on affiche le nom d'utilisateur
        // à la fois comme identifiant et comme nom affiché.
        if (nomAdminConnecte) nomAdminConnecte.textContent = user.nom_utilisateur;
        if (nomComplet) nomComplet.value = user.nom_utilisateur;
        if (nomUtilisateur) nomUtilisateur.value = user.nom_utilisateur;
        if (email) email.value = user.email;
    }

    const form = document.getElementById("formulaireProfilAdmin");

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
                    if (user) {
                        injectAdmin(user);
                    }
                    document.getElementById("nouveauMdpAdmin").value = "";
                    document.getElementById("confirmerMdpAdmin").value = "";
                } else {
                    showMessage("error", message);
                }
            } catch (error) {
                console.error(error);
                showMessage("error", "Erreur lors de l'enregistrement");
            }
        });
    }

    await loadAdmin();
});