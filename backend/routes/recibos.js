const express = require('express');
const Student = require('../models/Student');
const generarRecibo = require('../utils/generarRecibo');
const path = require('path');
const enviarReciboWhatsApp = require('../utils/enviarReciboWhatsApp');
const router = express.Router();

// ...existing code...

// Generar recibo de inscripción o mensualidad
router.post('/:id/recibo', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });

    const { concepto, monto, estado, mes } = req.body;
    const fecha = new Date().toLocaleDateString();
    const numeroRecibo = Date.now().toString();
    const datosAcademia = 'Dirección: Frente al residencial de mi vivienda, sector Cercadillo\nInstagram: @mente_tester\nEmail: elcristiano9095@gmail.com';
    const logoPath = path.resolve(__dirname, '../../frontend/src/mente-tester-logo.png');

    const filePath = await generarRecibo({
      nombreCompleto: student.nombreCompleto,
      concepto,
      monto,
      fecha,
      numeroRecibo,
      datosAcademia,
      logoPath,
      estado,
      mes
    });

    // Guardar pago en historial
    student.pagos.push({ concepto, monto, fecha: new Date(), numeroRecibo, estado, mes });
    await student.save();

    // Enviar recibo por WhatsApp (solo si el teléfono está presente)
    if (student.telefono) {
      try {
        await enviarReciboWhatsApp(student.telefono, filePath);
      } catch (e) {
        console.error('Error enviando WhatsApp:', e.message);
      }
    }

    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
