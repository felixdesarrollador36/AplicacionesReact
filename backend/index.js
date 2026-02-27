

// Rutas de usuarios

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rutas de usuarios
try {
  app.use('/api/users', require('./routes/users'));
} catch (err) {
  console.error('Error al cargar la ruta /api/users:', err);
}
// Rutas de estudiantes
app.use('/api/students', require('./routes/students'));
// Rutas de recibos
app.use('/api/recibos', require('./routes/recibos'));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error de conexión:', err));

// Rutas de ejemplo
app.get('/', (req, res) => {
  res.send('API de Mente Tester funcionando');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
