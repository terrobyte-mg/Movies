document.addEventListener("DOMContentLoaded", async () => {

    function ellipsis(str) {
        if (str.length > 10) return str.substring(0,10).concat("...");
        else return str;
    }

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
        if (isNaN(d.getDate())) return "—";
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    }

    function afficherStats(stats) {
        const totalEl = document.getElementById("totalUtilisateurs");
        const suspendusEl = document.getElementById("totalSuspendus");

        if (totalEl) totalEl.textContent = stats.total;
        if (suspendusEl) suspendusEl.textContent = stats.suspendus;
    }

    function ligneUtilisateur(user) {
        const suspendu = !!user.est_suspendue;
        const badgeStatut = suspendu
            ? `<span class="badge badge-suspendu" style="background:rgba(211,47,47,0.15); color:var(--rouge-mada); padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700;">Suspendu</span>`
            : `<span class="badge badge-actif" style="background:rgba(76,175,80,0.15); color:#4caf50; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700;">Actif</span>`;

        let boutonAction = suspendu
            ? `<button class="btn-table-action btn-reactiver" data-id="${user.id}" title="Réactiver"><i class="fa-solid fa-rotate-left" style="color:#4caf50;"></i></button>`
            : `<button class="btn-table-action btn-suspendre" data-id="${user.id}" title="Suspendre"><i class="fa-solid fa-ban" style="color:var(--rouge-mada);"></i></button>`;

        boutonAction = boutonAction.concat(`<button class="btn-table-action btn-supprimer" data-id="${user.id}" title="Supprimer"><i class="fa-solid fa-trash" style="color:var(--rouge-sombre);"></i></button>`);

        return `
            <tr data-user-row="${user.id}">
                <td style="text-align:center;">
                    <img src="${user.url_photo_profil || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150'}"
                         alt="Avatar" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                </td>
                <td style="font-weight:700; color:white;">${ellipsis(user.nom_utilisateur)}</td>
                <td>${ellipsis(user.email)}</td>
                <td>${user.role_utilisateur === "admin" ? "Admin" : "Utilisateur"}</td>
                <td>${badgeStatut}</td>
                <td>${formatterDate(user.date_creation)}</td>
                <td style="text-align: right">${boutonAction}</td>
            </tr>
        `;
    }

    function afficherUtilisateurs(users) {
        const corps = document.getElementById("corpsTableauUtilisateurs");
        if (!corps) return;

        if (users.length === 0) {
            corps.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--gris-clair);">Aucun utilisateur</td></tr>`;
            return;
        }

        corps.innerHTML = users.map(ligneUtilisateur).join("");

        // Actions suspendre / réactiver (délégation d'événement sur le tbody)
        corps.querySelectorAll(".btn-suspendre").forEach(btn => {
            btn.addEventListener("click", () => gererSuspension(btn.dataset.id, true));
        });
        corps.querySelectorAll(".btn-reactiver").forEach(btn => {
            btn.addEventListener("click", () => gererSuspension(btn.dataset.id, false));
        });
        corps.querySelectorAll(".btn-supprimer").forEach(btn => {
            btn.addEventListener("click", () => supprimerUtilisateur(btn.dataset.id));
        })
    }

    async function supprimerUtilisateur(id) {
        const confirmation = confirm("Supprimer ce compte definitivement.")

        if (!confirmation) return;

        try {
            const { success, message } = await api.deleteUser(id);

            if (success) {
                showMessage("success", message);
                await chargerUtilisateurs();
            } else {
                showMessage("error", message);
            }
        } catch (error) {
            console.error(error);
            showMessage("error", "Erreur lors de la supression du compte")
        }
    }

    async function gererSuspension(id, suspendre) {
        const confirmation = suspendre
            ? confirm("Suspendre ce compte ? L'utilisateur ne pourra plus se connecter.")
            : confirm("Réactiver ce compte ?");

        if (!confirmation) return;

        try {
            const { success, message } = suspendre
                ? await api.suspendUser(id)
                : await api.reactivateUser(id);

            if (success) {
                showMessage("success", message);
                await chargerUtilisateurs();
            } else {
                showMessage("error", message);
            }
        } catch (error) {
            console.error(error);
            showMessage("error", "Erreur lors de la mise à jour du compte");
        }
    }

    async function chargerUtilisateurs() {
        try {
            const { success, users, stats } = await api.getAdminUsers();

            if (!success) {
                console.error("Impossible de charger les utilisateurs");
                return;
            }

            afficherStats(stats);
            afficherUtilisateurs(users);

        } catch (error) {
            console.error("Erreur chargement utilisateurs", error);
        }
    }

    // Recherche live sur le tableau déjà chargé
    const champRecherche = document.getElementById("rechercheUtilisateurAdmin");
    if (champRecherche) {
        champRecherche.addEventListener("input", () => {
            const texte = champRecherche.value.toLowerCase();
            document.querySelectorAll("#corpsTableauUtilisateurs tr").forEach(tr => {
                tr.style.display = tr.textContent.toLowerCase().includes(texte) ? "" : "none";
            });
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

    await chargerAdmin();
    await chargerUtilisateurs();
});