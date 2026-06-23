console.log("AUTH.JS CHARGE");

document.addEventListener("DOMContentLoaded", () => {

    async function handleForm(form, action) {

        form.addEventListener("submit", async (e) => {

            e.preventDefault();

            const formData = new FormData(form);

            try {

                const response = await fetch(
                    `/movie/public/index.php?action=${action}`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

                const data = await response.json();

                if (data.success) {

                    showMessage("success", data.message);

                    if (data.redirect) {

                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 1000);

                    }

                } else {

                    showMessage("error", data.message);

                }

            } catch (error) {

                console.error(error);

                showMessage(
                    "error",
                    "Erreur de communication avec le serveur"
                );

            }

        });

    }

    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

    if (signupForm) {
        handleForm(signupForm, "signup");
    }

    if (loginForm) {
        handleForm(loginForm, "login");
    }

});