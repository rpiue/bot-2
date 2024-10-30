const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { Client } = require("whatsapp-web.js");
const botPersonal = require("./botPersonal");
const botGrupo = require("./botGrupo");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static("public"));

// Inicializa el cliente personal
//const clientPersonal = botPersonal(io);
// Inicializa el bot de grupo
const clientGrupo = botGrupo(io);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index34.html");
});

// Manejo de eventos de Socket.IO
io.on("connection", (socket) => {
  // Solicitar datos iniciales
  socket.on("requestData", async () => {
    socket.emit("initialData", {
      //botPersonalActive: botPersonal.isActive(),
      botGrupoActive: botGrupo.isActive(),
      //qrP: botPersonal.getCurrentQr(),
      qrG: botGrupo.getCurrentQr(),
    });

    // Emitir QR si está disponible
    //if (!botPersonal.isActive()) {
    //  socket.emit("qr", botPersonal.getCurrentQr());
    //}
    if (!botGrupo.isActive()) {
      socket.emit("qrBot", botGrupo.getCurrentQr());
    }
    if (botGrupo.isActive()) {
      const allowedGroupIds = botGrupo.getAllowedGroupIds();
      if (allowedGroupIds.length > 0) {
        try {
          const grupos = await botGrupo.getGrupos(); // Obtener los grupos disponibles
          socket.emit("grupoData", grupos); // Emitir los datos del grupo al cliente
        } catch (error) {
          console.error("Error al obtener los grupos:", error);
        }
      }
      const grupos = await botGrupo.mostrarGrupos();

      socket.emit("gruposDisponibles", grupos);
    }
  });

  socket.on("selectGrupos", async (selectedGroupIds) => {
    console.log("Lo q manda la web:", selectedGroupIds);
    await botGrupo.selectGrupos(selectedGroupIds);

    // Después de que se seleccionan los grupos, se muestra la lista
    const grupos = await botGrupo.getGrupos();
    socket.emit("grupoData", grupos);
  });

  socket.on("sendWelcome", async ({ imageUrl, message }) => {
    try {
      // Llama a la función bienvenida y pasa la URL de imagen y el mensaje
      botGrupo.bienvenida(imageUrl, message);
      socket.emit("welcomeStatus", {
        message: "Mensaje de bienvenida enviado correctamente.",
      });
    } catch (error) {
      console.error("Error al enviar mensaje de bienvenida:", error);
      socket.emit("welcomeStatus", {
        message: "Error al enviar mensaje de bienvenida.",
      });
    }
  });

  socket.on("toggleBotPersonal", () => {
    botPersonal.toggle();
    socket.emit("botPersonalStatus", botPersonal.isActive());
  });

  socket.on("toggleBotGrupo", () => {
    botGrupo.toggle();
    socket.emit("botGrupoStatus", botGrupo.isActive());
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
