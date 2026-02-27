const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  telefono: { type: String, required: true },
  correo: { type: String },
  cursoInscrito: { type: String, required: true },
  fechaInscripcion: { type: Date, default: Date.now },
  duracionMeses: { type: Number, default: 6 }, // 6 para QA Manual, 3 para QA Automatizado
  precioTotal: { type: Number, default: 0 }, // Precio total del curso
  pagos: [
    {
      concepto: String, // Inscripción o Mensualidad
      monto: Number,
      fecha: Date,
      numeroRecibo: String,
      estado: String, // Pagado, Pendiente, etc.
      mes: String // Solo para mensualidad
    }
  ]
});

module.exports = mongoose.model('Student', studentSchema);