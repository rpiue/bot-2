const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let client;
let active = false;
let currentQr = ""; // Para almacenar el QR actual

function init(io) {
    client = new Client({});

    client.on("qr", (qr) => {
        console.log("QR generado para el bot personal");
        qrcode.generate(qr, { small: true });
        currentQr = qr; // Guardar el QR
        io.emit("qr", qr); // Emitir QR
    });

    client.on("ready", () => {
        console.log("Bot personal listo");
        active = true;
        io.emit("ready"); // Notificar al cliente
    });

    client.on("message", (message) => {
        handleCommand(message);
    });

    client.initialize();
    return client;
}

function toggle() {
    active = !active;
    if (active) {
        client.initialize();
    } else {
        client.destroy(); // Destruir el cliente si se desactiva
    }
}

function isActive() {
    return active;
}

// Método para obtener el QR actual
function getCurrentQr() {
    return currentQr;
}

// Manejo de comandos para el bot personal
function handleCommand(message) {
    const chatId = message.from;

    if (message.body === "!saludo") {
        client.sendMessage(chatId, "¡Hola! ¿Cómo estás?");
    } else if (message.body === "!despedida") {
        client.sendMessage(chatId, "¡Hasta luego! Que tengas un buen día.");
    }
}

module.exports = init;
module.exports.toggle = toggle;
module.exports.isActive = isActive;
module.exports.getCurrentQr = getCurrentQr; // Exportar la función para obtener el QR actual
