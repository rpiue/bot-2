const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
} = require("firebase/firestore");
const { Client, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeEwqwoXsg8OmEIkPQ_rnw6D7iqcagJnI",
  authDomain: "controlgru.firebaseapp.com",
  projectId: "controlgru",
  storageBucket: "controlgru.appspot.com",
  messagingSenderId: "882032721386",
  appId: "1:882032721386:web:f680854fdd5aac46ca8693",
  measurementId: "G-8YJCB6399J",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let grupos = [];
let gruposData = [];
let client;
let active = false;
let currentImageIndex = 0; // Índice del mensaje de imagen actual
let messageTimeout; // Variable para el temporizador

let currentQr = "";

// Lista de IDs de grupos permitidos
let ALLOWED_GROUP_IDS = [
  //"120363336928180852@g.us", // Reemplaza con los IDs de los grupos que quieras permitir
  //"120363341798146718@g.us",
  // Agrega más IDs de grupos según sea necesario
];

async function loadGroupData() {
  gruposData = []; // Vaciar el array de grupos antes de actualizarlo
  for (const groupId of ALLOWED_GROUP_IDS) {
    try {
      const chat = await client.getChatById(groupId); // Obtener el chat por ID
      if (chat.isGroup) {
        const participantes = chat.participants.map((participant) => ({
          number: participant.id.user, // Obtén solo el número de cada participante
        }));

        // Añadir el grupo con los participantes al array de grupos
        gruposData.push({
          groupName: chat.name, // Nombre del grupo
          totalParticipantes: participantes.length,
          participantes, // Participantes del grupo
        });
      }
      //  console.log("Numero:", grupos);
      // console.log("Numero:", JSON.stringify(grupos, null, 2));
    } catch (error) {
      console.error(`Error al obtener el grupo ${groupId}:`, error);
    }
  }
}

async function getGrupos() {
  await loadGroupData(); // Cargar los datos de los grupos
  //console.log("Numero:", JSON.stringify(grupos, null, 2));
  return gruposData; // Devolver una copia del array con los datos actualizados
}

async function mostrarGrupos() {
  const grupos = await loadGroups();
  return grupos;
}

function init(io) {
  client = new Client({});

  client.on("qr", (qr) => {
    console.log("QR generado para el bot de grupo");
    qrcode.generate(qr, { small: true });
    currentQr = qr; // Guardar el QR
    io.emit("qrBot", qr); // Emitir QR del bot de grupo
  });

  client.on("ready", async () => {
    console.log("Bot de grupo listo");
    active = true;
    io.emit("readyBot"); // Notificar al cliente

    try {
      // Obtener grupos después de que el cliente esté listo
      const grupos = await loadGroups(); // Asegúrate de que loadGroupData esté disponible
      console.log("Grupos disponibles:", grupos);

      // Emitir los grupos al cliente
      io.emit("gruposDisponibles", grupos);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
    }

    // Array para almacenar los grupos y participantes
    //await loadGroupData();

    // Emitir los datos de los grupos al frontend
    //io.emit("grupoData", grupos);
  });

  // Función para mostrar los números de teléfono de los participantes del grupo
  async function mostrarParticipantes(chat) {
    const participantes = chat.participants; // Acceder directamente a los participantes
    console.log(
      `Números de teléfono de los participantes del grupo ${chat.name}:`
    );
    participantes.forEach((participant) => {
      const phoneNumber = participant.id.user; // Obtiene el número telefónico
      console.log(phoneNumber); // Muestra el número en la terminal
    });
  }

  client.on("message", async (message) => {
    // Solo proceder si el mensaje es de un grupo permitido
    if (ALLOWED_GROUP_IDS.includes(message.from)) {
      handleCommand(message);
      if (active) {
        // Almacenar mensajes solo de los grupos permitidos
        await storeMessage(message); // Almacenar el mensaje en Firebase
      }

      // Iniciar temporizador para enviar imágenes después de 5 segundos
      clearTimeout(messageTimeout); // Limpiar cualquier temporizador anterior
      messageTimeout = setTimeout(() => {
        sendImageMessage(message.from);
      }, 60000);
    }
  });

  const imageMessages = [
    {
      image:
        "https://firebasestorage.googleapis.com/v0/b/pago2-858c1.appspot.com/o/DESCUBRE%20TODO%20SOBRE%20LA(18).png?alt=media&token=d3d58f4a-ffee-41e8-b486-97b79e4c8ecc",
      message:
        "🌟 **¡Descubre Yape Fake y BCP Fake!** 🌟\n¿Buscas aplicaciones realistas y funcionales? ¡Las mejores opciones para realizar pagos de forma rápida y sencilla están aquí! 🎉\n\n📲 *Escanea el código QR* o *ingresa al enlace de mi perfil* para obtener las aplicaciones gratis. ¡No te lo pierdas! 🔥\n\n🤔 Si tienes alguna duda o consulta, ¡no dudes en escribirme por privado! Estoy aquí para ayudarte. 💬",
    },
    {
      image:
        "https://firebasestorage.googleapis.com/v0/b/pago2-858c1.appspot.com/o/DESCUBRE%20TODO%20SOBRE%20LA(17).png?alt=media&token=42e2c3e1-92c2-4180-8dc5-f42c5c0d1817",
      message: `🚀 *¡Lleva tu negocio al siguiente nivel con nuestro Bot de WhatsApp!* 🤖✨\n\n¿Estás cansado de responder las mismas preguntas una y otra vez? ¡Deja que nuestro bot se encargue de eso por ti! 🙌\n\n✅ **Beneficios del Bot:**\n*Automatización 24/7:* ¡Nunca más pierdas una venta! Tu bot está disponible todo el día, todos los días. 🕒\n*Respuestas instantáneas:* Contesta a tus clientes al instante y mantén su interés. 💬⚡\n*Gestión de pedidos simplificada:* Facilita el proceso de compra y seguimiento de pedidos sin complicaciones. 🛒📦\n*Personalización:* Crea conversaciones únicas y ajusta el bot según tus necesidades. 🎨\n\n📞 *¡Contáctanos ahora y transforma tu forma de vender!* 💥`,
    },
  ];

  async function sendImageMessage(groupId) {
    try {
      // Enviar el mensaje de imagen actual
      const { image, message } = imageMessages[currentImageIndex];

      const response = await axios.get(image, {
        responseType: "arraybuffer",
      });
      const imageBase64 = Buffer.from(response.data, "binary").toString(
        "base64"
      );
      const imagen = new MessageMedia("image/png", imageBase64);

      await client.sendMessage(groupId, message, { media: imagen });

      // Actualizar el índice del mensaje de imagen
      currentImageIndex = (currentImageIndex + 1) % imageMessages.length; // Ciclo a través de los mensajes

      // Esperar 5 segundos antes de enviar el siguiente mensaje
    } catch (error) {
      console.error("Error al enviar el mensaje de imagen:", error);
    }
  }

  client.initialize();
  return client;
}

function configurarBienvenida(imageUrl, texto) {
  client.on("group_join", async (notification) => {
    const chat = await client.getChatById(notification.chatId);
    if (ALLOWED_GROUP_IDS.includes(chat.id._serialized)) {
      const contactId = notification.id.participant;
      const contact = await client.getContactById(contactId);
      const nombreUsuario = contact.pushname || "Usuario";
      const mensajeBienvenida = `👋 ¡Hola @${contact.id.user}! Bienvenido/a al grupo *${chat.name}* 🎉\n${texto}`;

      if (imageUrl) {
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        const imageBase64 = Buffer.from(response.data, "binary").toString(
          "base64"
        );
        const imagen = new MessageMedia("image/png", imageBase64);
        await chat.sendMessage(imagen, {
          caption: mensajeBienvenida,
          mentions: [contactId],
        });
      } else {
        await chat.sendMessage(mensajeBienvenida, { mentions: [contactId] });
      }
    }
  });
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

function getAllowedGroupIds() {
  return ALLOWED_GROUP_IDS;
}

// Manejo de comandos para el bot de grupo
function handleCommand(message) {
  if (message.body === "!info") {
    client.sendMessage(
      message.from,
      "Este es un bot de grupo. ¿En qué puedo ayudarte?"
    );
  } else if (message.body === "!ayuda") {
    client.sendMessage(
      message.from,
      "Puedes usar los siguientes comandos: !info, !ayuda"
    );
  }
}

function getLimaTime() {
  const date = new Date();
  const utcOffset = -5; // Lima es UTC-5
  const localTime = new Date(date.getTime() + utcOffset * 60 * 60 * 1000);
  return localTime.toISOString(); // Devuelve la hora en formato ISO
}

// Almacenar mensaje en Firebase
async function storeMessage(message) {
  // Obtener el chat del mensaje
  const chat = await message.getChat(); // Obtiene el chat donde se recibió el mensaje
  const grupoID = message.from;
  const senderId = message.fromMe ? "Tú" : message.author || message.from;
  const dispositivo = message.deviceType;
  const nombre = chat.lastMessage?._data?.notifyName;

  // Si es un mensaje de grupo, obtenemos el número de teléfono del remitente real
  let phoneNumber;
  let groupName;
  if (chat.isGroup) {
    groupName = chat.name;
    const participants = await chat.participants; // Obtener la lista de participantes
    const participant = participants.find((p) => p.id._serialized === senderId);

    let notifyName;
    if (participant) {
      notifyName = participant.notifyName; // Obtener el notifyName
    } else {
      notifyName = "Sin nombre";
    }

    if (participant) {
      phoneNumber = participant.id.user; // Obtener el número telefónico
      console.log("Número telefónico del participante:", phoneNumber);
      console.log("Nombre del participante 3:", nombre);
      console.log("Dispositivo del participante:", dispositivo);
    } else {
      console.log("No se encontró el número telefónico del remitente.");
      return; // Salir si no se encuentra el participante
    }
  } else {
    // Si no es un grupo, el senderId es el número de teléfono
    phoneNumber = senderId.split("@")[0]; // Eliminar el dominio
    console.log("Número telefónico:", phoneNumber);
  }

  let messageText = message.body ?? "Envio para ver una sola ves";

  // Identificar el tipo de contenido
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    if (media.mimetype.startsWith("image/")) {
      messageText = "Envió una imagen";
    } else if (media.mimetype.startsWith("video/")) {
      messageText = "Envió un video";
    } else if (media.mimetype.startsWith("audio/")) {
      messageText = "Envió un audio";
    } else {
      const fileType = media.mimetype.split("/").pop();
      messageText = `Guardó un archivo ${fileType}`;
    }
  }

  // Aquí manejas el almacenamiento en Firestore
  try {
    const userMessageRef = doc(db, "messages", grupoID); // Usar el número de teléfono como ID del documento
    const userDocSnapshot = await getDoc(userMessageRef);

    // Si el documento no existe, crear uno nuevo
    if (!userDocSnapshot.exists()) {
      await setDoc(userMessageRef, {
        totalDeMsj: 1,
        messages: {
          [getLimaTime()]: { [phoneNumber]: messageText },
        },
        Nombre: groupName,
      });
      console.log("Documento creado para:", phoneNumber);
    } else {
      // Si el documento ya existe, actualizarlo
      const userData = userDocSnapshot.data();
      const currentCount = userData.totalDeMsj || 0;
      const messages = userData.messages || {};

      // Actualizar el documento del usuario
      await updateDoc(userMessageRef, {
        totalDeMsj: currentCount + 1,
        messages: {
          ...messages,
          [getLimaTime()]: { [phoneNumber]: messageText },
        },
      });
      console.log("Documento actualizado para:", phoneNumber);
    }
  } catch (error) {
    console.error("Error al agregar el mensaje: ", error);
  }
}

async function loadGroups() {
  try {
    const chats = await client.getChats();
    grupos = chats.filter((chat) => chat.isGroup); // Solo chats que son grupos
    return grupos.map((group) => ({
      id: group.id._serialized,
      name: group.name,
    }));
  } catch (error) {
    console.error("Error al obtener los grupos:", error);
  }
}

// Permite al usuario seleccionar grupos y agregar los IDs a ALLOWED_GROUP_IDS
async function selectGrupos(selectedGroupIds) {
  try {
    // Validar que selectedGroupIds sea un arreglo válido y no esté vacío
    if (!Array.isArray(selectedGroupIds) || selectedGroupIds.length === 0) {
      throw new Error("No se han proporcionado IDs de grupos válidos.");
    }

    // Filtrar los grupos que coincidan con los IDs seleccionados
    const selectedGroups = grupos.filter((group) => {
      // Validar que group.id._serialized exista antes de incluirlo
      return (
        group && group.id && selectedGroupIds.includes(group.id._serialized)
      );
    });

    // Actualizar la lista de grupos permitidos con los IDs serializados
    ALLOWED_GROUP_IDS = selectedGroups.map((group) => group.id._serialized);

    console.log("Grupos permitidos seleccionados:", ALLOWED_GROUP_IDS);

    // Si no hay grupos permitidos, lanzar un error
    if (ALLOWED_GROUP_IDS.length === 0) {
      throw new Error("Ninguno de los grupos seleccionados está permitido.");
    }
  } catch (error) {
    console.error("Error al seleccionar los grupos:", error.message || error);
  }
}

module.exports = init;
module.exports.toggle = toggle;
module.exports.isActive = isActive;
module.exports.getGrupos = getGrupos;
module.exports.mostrarGrupos = mostrarGrupos;
module.exports.getCurrentQr = getCurrentQr;
module.exports.selectGrupos = selectGrupos;
module.exports.getAllowedGroupIds = getAllowedGroupIds;
module.exports.bienvenida = configurarBienvenida;
