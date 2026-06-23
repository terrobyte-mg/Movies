document.addEventListener("DOMContentLoaded", async () => {

    // =========================
    // 1. LOGOUT
    // =========================
    const logoutBtn = document.getElementById("logoutButton");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            try {
                const response = await fetch("/movie/public/index.php?action=logout", {
                    method: "POST"
                });

                const data = await response.json();

                if (data.success) {
                    showMessage("success", data.message);

                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);

                } else {
                    showMessage("error", data.message);
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
            const response = await fetch("/movie/public/index.php?action=user");
            const data = await response.json();

            if (!data.success || !data.user) {
                console.log("Utilisateur non connecté");
                return;
            }

            const user = data.user;

            // Injection UI
            injectUser(user);

        } catch (error) {
            console.error("Erreur chargement user", error);
        }
    }

    // =========================
    // 3. INJECTION DOM
    // =========================
    function injectUser(user) {

        const nomSidebar = document.getElementById("nomUtilisateurConnecte");
        const nomHeader = document.querySelector(".profil-utilisateur span");

        if (nomSidebar) {
            nomSidebar.textContent = user.nom_utilisateur;
        }

        if (nomHeader) {
            nomHeader.textContent = user.nom_utilisateur;
        }

        // optionnel avatar si tu l’ajoutes plus tard
        const avatar = document.querySelector(".avatar-grand");
        if (avatar && user.avatar) {
            avatar.src = user.avatar;
        }
    }

    // =========================
    // 4. INIT
    // =========================
    await loadUser();

});