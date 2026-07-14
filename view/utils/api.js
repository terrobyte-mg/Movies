/**
 * Client API centralisé pour MADAMOV.
 * Toutes les pages doivent passer par cette classe au lieu de faire
 * leurs propres fetch() dupliqués.
 *
 * Utilisation :
 *   const { success, message, data } = await api.getFilms({ genre: "Action" });
 */
class Api {

    constructor() {
        // Le vrai routeur est index.php?action=..., pas /api
        this.baseUrlApi = "/movie/public/index.php";
    }

    async request(action, { method = "GET", params = null, body = null, isFormData = false } = {}) {
        let url = `${this.baseUrlApi}?action=${action}`;

        if (params) {
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")
            );
            const query = new URLSearchParams(cleanParams).toString();
            if (query) {
                url += `&${query}`;
            }
        }

        const options = { method };

        if (body) {
            if (isFormData) {
                options.body = body;
            } else {
                options.headers = { "Content-Type": "application/json" };
                options.body = JSON.stringify(body);
            }
        }

        let response;
        try {
            response = await fetch(url, options);
        } catch (networkError) {
            return { success: false, message: "Erreur réseau", httpStatus: 0 };
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Réponse serveur non JSON:", text);
            return { success: false, message: "Réponse serveur invalide", httpStatus: response.status };
        }

        return { httpStatus: response.status, ...data };
    }

    toFormData(obj) {
        const fd = new FormData();
        Object.entries(obj).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                fd.append(key, value);
            }
        });
        return fd;
    }

    // =========================
    // Auth
    // =========================

    login(email, motDePasse) {
        return this.request("login", {
            method: "POST",
            isFormData: true,
            body: this.toFormData({
                email_utilisateur: email,
                mot_de_passe: motDePasse
            })
        });
    }

    loginAdmin(email, motDePasse) {
        return this.request("admin-login", {
            method: "POST",
            isFormData: true,
            body: this.toFormData({
                email_utilisateur: email,
                mot_de_passe: motDePasse
            })
        });
    }

    signup(nomUtilisateur, email, dateNaissance, mdp1, mdp2) {
        return this.request("signup", {
            method: "POST",
            isFormData: true,
            body: this.toFormData({
                nom_utilisateur: nomUtilisateur,
                email_utilisateur: email,
                date_naissance_utilisateur: dateNaissance,
                mot_de_passe1: mdp1,
                mot_de_passe2: mdp2
            })
        });
    }

    logout() {
        return this.request("logout", { method: "POST" });
    }

    // =========================
    // Utilisateur
    // =========================

    getCurrentUser() {
        return this.request("user");
    }

    updateProfile(formData) {
        return this.request("update-profile", {
            method: "POST",
            isFormData: true,
            body: formData
        });
    }

    deleteAccount(motDePasse) {
        return this.request("delete-account", {
            method: "POST",
            isFormData: true,
            body: this.toFormData({ mot_de_passe_confirmation: motDePasse })
        });
    }

    // =========================
    // Films
    // =========================

    getFilms(filters = {}) {
        return this.request("films", { params: filters });
    }

    getFilm(id) {
        return this.request("film", { params: { id } });
    }

    getAdminFilm(id) {
        return this.request("admin-film", { params: { id } });
    }

    getGenres() {
        return this.request("genres");
    }

    rateFilm(id, note) {
        return this.request("film-rate", {
            method: "POST",
            params: { id },
            body: { note }
        });
    }

    getFilmComments(filmId) {
        return this.request("film-comments", { params: { id: filmId } });
    }

    addFilmComment(filmId, commentaire) {
        return this.request("film-comment-add", {
            method: "POST",
            params: { id: filmId },
            body: { commentaire }
        });
    }

    deleteFilmComment(commentId) {
        return this.request("film-comment-delete", {
            method: "POST",
            params: { id: commentId }
        });
    }

    createFilm(data) {
        return this.request("film-create", { method: "POST", body: data });
    }

    updateFilm(id, data) {
        return this.request("film-update", { method: "POST", params: { id }, body: data });
    }

    deleteFilm(id) {
        return this.request("film-delete", { method: "POST", params: { id } });
    }

    // =========================
    // Admin
    // =========================

    getAdminDashboard() {
        return this.request("admin-dashboard-data");
    }

    getAdminUsers() {
        return this.request("admin-users-list");
    }

    suspendUser(id) {
        return this.request("admin-user-suspend", { method: "POST", params: { id } });
    }

    reactivateUser(id) {
        return this.request("admin-user-reactivate", { method: "POST", params: { id } });
    }

    deleteUser(id) {
        return this.request("admin-user-delete", { method: "POST", params: {id} })
    }

}

const api = new Api();