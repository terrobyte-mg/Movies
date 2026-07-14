console.log("AUTH.JS CHARGE");

document.addEventListener("DOMContentLoaded", () => {

    function handleResult({ success, message, redirect }) {
        if (success) {
            showMessage("success", message);

            if (redirect) {
                setTimeout(() => {
                    window.location.href = redirect;
                }, 1000);
            }
        } else {
            showMessage("error", message);
        }
    }

    function handleForm(form, submitFn) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            try {
                const result = await submitFn(new FormData(form));
                handleResult(result);
            } catch (error) {
                console.error(error);
                showMessage("error", "Erreur de communication avec le serveur");
            }
        });
    }

    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");
    const adminLoginForm = document.getElementById("adminLoginForm");

    if (signupForm) {
        handleForm(signupForm, (formData) => api.signup(
            formData.get("nom_utilisateur"),
            formData.get("email_utilisateur"),
            formData.get("date_naissance_utilisateur"),
            formData.get("mot_de_passe1"),
            formData.get("mot_de_passe2")
        ));
    }

    if (loginForm) {
        handleForm(loginForm, (formData) => api.login(
            formData.get("email_utilisateur"),
            formData.get("mot_de_passe")
        ));
    }

    // Formulaire de connexion admin — vue séparée (view/admin/login.html),
    // jamais rendue accessible depuis la navigation publique.
    if (adminLoginForm) {
        handleForm(adminLoginForm, (formData) => api.loginAdmin(
            formData.get("email_utilisateur"),
            formData.get("mot_de_passe")
        ));
    }

});

const cheminIcons = "/movie/view/assets/icons.svg";
function basculerMotDePasse(idChamp, icon) {
    const input = document.getElementById(idChamp);
    const icone = document.getElementById(icon);
    if (input.type === "password") {
        input.type = "text";
        icone.setAttribute('href', `${cheminIcons}#eye-slash`);
    } else {
        input.type = "password";
        icone.setAttribute('href', `${cheminIcons}#eye`);
    }
}