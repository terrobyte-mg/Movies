console.log("TOAST.JS CHARGE");

document.addEventListener("DOMContentLoaded", () => {

    if (!document.getElementById("messageBox")) {

        const box = document.createElement("div");
        box.id = "messageBox";

        document.body.appendChild(box);
    }

});

function showMessage(type, message) {

    const messageBox = document.getElementById("messageBox");

    if (!messageBox) {
        console.error("messageBox introuvable");
        return;
    }

    const iconClass =
        type === "success"
            ? "fa-solid fa-circle-check"
            : "fa-solid fa-circle-exclamation";

    const title =
        type === "success"
            ? "Succès"
            : "Erreur";

    messageBox.innerHTML = `
        <div class="toast-card ${type}">
            <i class="${iconClass} toast-icon"></i>

            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        </div>
    `;

    setTimeout(() => {
        messageBox.innerHTML = "";
    }, 4000);
}