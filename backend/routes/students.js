const express = require('express');
const Student = require('../models/Student');
const router = express.Router();

const calcularDuracionYPrecio = (cursoInscrito) => {
  let duracionMeses = 6;
  let precioTotal = 2400;

  if (
    cursoInscrito &&
    (cursoInscrito.toLowerCase().includes('automatizado') ||
      cursoInscrito.toLowerCase().includes('automatización') ||
      cursoInscrito.toLowerCase().includes('automatizacion') ||
      cursoInscrito.toLowerCase().includes('automation'))
  ) {
    duracionMeses = 3;
    precioTotal = 3000;
  }

  return { duracionMeses, precioTotal };
};

// Registrar nuevo estudiante
router.post('/', async (req, res) => {
  try {
    const { nombreCompleto, telefono, correo, cursoInscrito } = req.body;
    
    // Determinar duración y precio según el curso
    const { duracionMeses, precioTotal } = calcularDuracionYPrecio(cursoInscrito);
    
    const student = new Student({
      nombreCompleto,
      telefono,
      correo,
      cursoInscrito,
      duracionMeses,
      precioTotal
    });
    
    await student.save();
    res.status(201).json({ mensaje: 'Estudiante registrado', student });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener todos los estudiantes
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar estudiante
router.put('/:id', async (req, res) => {
  try {
    const { nombreCompleto, telefono, correo, cursoInscrito } = req.body;
    const updateData = { nombreCompleto, telefono, correo, cursoInscrito };

    if (cursoInscrito) {
      const { duracionMeses, precioTotal } = calcularDuracionYPrecio(cursoInscrito);
      updateData.duracionMeses = duracionMeses;
      updateData.precioTotal = precioTotal;
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json({ mensaje: 'Estudiante actualizado', student });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar estudiante
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json({ mensaje: 'Estudiante eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener pagos de un estudiante
router.get('/:id/pagos', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json(student.pagos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;