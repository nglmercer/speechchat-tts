const { WebcastPushConnection } = require('tiktok-live-connector');
const say = require('say');

let tiktokLiveConnection = new WebcastPushConnection('@USUARIO', {
  processInitialData: false,
  enableExtendedGiftInfo: true,
  enableWebsocketUpgrade: true,
  requestPollingIntervalMs: 2000,
  clientParams: {
    "app_language": "en-US",
    "device_platform": "web"
  },
  requestHeaders: {
    "headerName": "headerValue"
  },
  websocketHeaders: {
    "headerName": "headerValue"
  },
  requestOptions: {
    timeout: 10000
  },
  websocketOptions: {
    timeout: 10000
  }
});

// Conéctate al chat (también se puede usar await)
tiktokLiveConnection.connect().then(state => {
  console.info(`Conectado a la sala ${state.roomId}`);
}).catch(err => {
  console.error('Fallo al conectar');
});

// Lista para almacenar los mensajes en espera
let messageQueue = [];
let isSpeaking = false; // Variable para controlar si se está reproduciendo un mensaje

// En el evento 'chat'
tiktokLiveConnection.on('chat', data => {
  console.log(`${data.uniqueId} : ${data.comment}`);
  let comment = data.comment;

  if (comment.startsWith('/') || comment.startsWith('!') || comment.startsWith('.')) {
    let messageText = comment;

    // Agregar el mensaje a la lista de espera
    messageQueue.push(`${messageText} de ${data.uniqueId}`);
    reproducirSiguienteMensaje();
  }
});

// En los otros eventos (gift, envelope, subscribe, follow)
tiktokLiveConnection.on('gift', data => {
    let message = '';
  
    if (data.giftType === 1 && !data.repeatEnd) {
      // Streak in progress => show only temporary
      console.log(`${data.uniqueId}  ${data.giftName} x${data.repeatCount}`);
      if (data.repeatCount === 1) {
        // Only add the gift name once for streak gifts
        message = `${data.giftName}`;
        messageQueue.push(message);
      }
    } else {
      // Streak ended or non-streakable gift => process the gift with final repeat_count
      console.log(`${data.uniqueId} ${data.giftName} x${data.repeatCount}`);
      message = `${data.giftName} por ${data.repeatCount} de ${data.uniqueId}`;
      messageQueue.push(message);
    }
  
    reproducirSiguienteMensaje();
  });

tiktokLiveConnection.on('envelope', data => {
  let message = `${data.uniqueId} envió un Cofre!!!`;
  messageQueue.push(message);
  reproducirSiguienteMensaje();
});

tiktokLiveConnection.on('subscribe', data => {
  let message = `${data.uniqueId} se suscribió!`;
  messageQueue.push(message);
  reproducirSiguienteMensaje();
});

tiktokLiveConnection.on('follow', data => {
  let message = `${data.uniqueId} te sigue!`;
  messageQueue.push(message);
  reproducirSiguienteMensaje();
});

function reproducirSiguienteMensaje() {
  // Si no se está reproduciendo ningún mensaje y hay mensajes en la lista de espera
  if (!isSpeaking && messageQueue.length > 0) {
    const message = messageQueue.shift(); // Obtener el siguiente mensaje de la lista
    isSpeaking = true;

    // Filtrar caracteres especiales en el mensaje
    const filteredMessage = message.replace(/[*_;:,()[\]{}<>\\/|#@\"'`^&%$.]/g, '');

    let waitTime = 1000; // Tiempo de espera predeterminado de 1 segundo

    if (filteredMessage.length > 30) {
      waitTime = 6000; // Si el mensaje tiene más de 30 caracteres, esperar 6 segundos
    } else if (filteredMessage.length > 10) {
      waitTime = 3000; // Si el mensaje tiene más de 10 caracteres, esperar 3 segundos
    }

    say.speak(filteredMessage, 'Microsoft Sabina Desktop - Spanish (Spain)', 1, (err) => {
      if (err) {
        console.error('Error al reproducir el mensaje:');
      }

      // Marcar como finalizado y reproducir el siguiente mensaje después de un breve retraso
      isSpeaking = false;
      setTimeout(reproducirSiguienteMensaje, waitTime); // Esperar el tiempo determinado antes de reproducir el siguiente mensaje
    });
  }
}
