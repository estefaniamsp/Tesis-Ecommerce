import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxLength: 30,
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20,
    },
    genero: {
      type: String,
      required: true,
      trim: true,
      maxLength: 10,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxLength: 30,
      unique: true,
    },
    codigoRecuperacion: {
      type: Number,
      default: null,
    },
    rol: {  
      type: String,
      enum: ['admin', 'cliente'],
      default: 'cliente',
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

usuarioSchema.methods.encryptPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Método para comparar contraseñas
usuarioSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Método para crear un token
usuarioSchema.methods.createToken = function () {
  const tokenGenerado  = this.token = Math.random().toString(36).slice(2)
  return tokenGenerado
};

const Usuarios = mongoose.model("Usuarios", usuarioSchema);
export default Usuarios