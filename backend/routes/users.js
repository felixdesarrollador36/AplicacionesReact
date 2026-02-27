const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

// Registrar nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { usuario, clave, nombre, correo } = req.body;
    
    console.log('Datos recibidos:', { usuario, clave: clave ? '***' : undefined, nombre, correo });
    
    // Validar campos requeridos
    if (!usuario || !clave || !nombre) {
      return res.status(400).json({ error: 'Usuario, clave y nombre son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existeUsuario = await User.findOne({ usuario });
    if (existeUsuario) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hashear la contraseña
    const claveHash = await bcrypt.hash(clave, 10);

    // Crear nuevo usuario
    const user = new User({
      usuario,
      clave: claveHash,
      nombre,
      correo
    });

    await user.save();
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', usuario: user.usuario });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(400).json({ error: err.message || 'Error al registrar usuario' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { usuario, clave } = req.body;
    
    console.log('Intento de login:', usuario);
    
    // Validar campos requeridos
    if (!usuario || !clave) {
      return res.status(400).json({ error: 'Usuario y clave son requeridos' });
    }

    // Buscar usuario
    const user = await User.findOne({ usuario });
    if (!user) {
      return res.status(400).json({ error: 'Usuario o clave incorrectos' });
    }

    // Verificar contraseña
    const claveValida = await bcrypt.compare(clave, user.clave);
    if (!claveValida) {
      return res.status(400).json({ error: 'Usuario o clave incorrectos' });
    }

    res.json({ mensaje: 'Login exitoso', usuario: user.usuario, nombre: user.nombre });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;

// Obtener lista de usuarios (sin clave)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-clave -__v');
    res.json(users);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, nombre, correo, clave } = req.body;

    const update = { usuario, nombre, correo };
    if (clave) {
      update.clave = await bcrypt.hash(clave, 10);
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true, select: '-clave -__v' });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});