const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  clave: { type: String, required: true },
  nombre: { type: String, required: true },
  correo: { type: String }
});

module.exports = mongoose.model('User', userSchema);