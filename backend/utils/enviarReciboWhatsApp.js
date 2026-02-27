const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
const client = twilio(accountSid, authToken);

async function enviarReciboWhatsApp(telefono, filePath) {
  const mediaUrl = await subirArchivoTemporal(filePath); // Debes implementar esta función si usas Twilio API
  return client.messages.create({
    from: `whatsapp:${whatsappFrom}`,
    to: `whatsapp:${telefono}`,
    body: 'Aquí tienes tu recibo de pago de Mente Tester.',
    mediaUrl: [mediaUrl]
  });
}

// Esta función es un placeholder. Twilio requiere que el PDF esté accesible públicamente.
async function subirArchivoTemporal(filePath) {
  // Sube el archivo a un storage público y retorna la URL
  // Ejemplo: AWS S3, Google Cloud Storage, etc.
  // Por ahora, retorna una URL de ejemplo
  return 'https://ejemplo.com/recibo.pdf';
}

module.exports = enviarReciboWhatsApp;
