import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    default: "admin@gmail.com",
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: null
  },
  confirmEmail: {
    type: Boolean,
    default: false
  },
  codigoRecuperacion: {
    type: String,
    default: null
  },
  codigoRecuperacionExpires: {  
    type: Date,
    default: null
  }
});


// Método para comparar contraseñas
AdminSchema.methods.compararPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Método para crear un token
AdminSchema.methods.crearToken = function () {
  const tokenGenerado = this.token = Math.random().toString(36).slice(2)
  return tokenGenerado
};

AdminSchema.methods.encryptPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const Admin = mongoose.model("Admin", AdminSchema);

export default Admin;
