import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const clienteSchema = new Schema(
  {
    cedula: {
      type: String,
      maxLength: 20,
      trim: true,
    },
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
    ciudad: {
      type: String,
      trim: true,
      maxLenght: 10,
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
    direccion: {
      type: String,
      trim: true,
      maxLenght: 30,
    },
    fecha_nacimiento: {
      type: Date,
    },
    telefono: {
      type: String,
      trim: true,
      maxLenght: 10,
    },
    codigoRecuperacion: {
      type: Number,
      default: null,
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
    }
  },
  {
    timestamps: true,
  }
);

clienteSchema.methods.encryptPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Método para comparar contraseñas
clienteSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Método para crear un token
clienteSchema.methods.crearToken = function () {
  const tokenGenerado = this.token = Math.random().toString(36).slice(2)
  return tokenGenerado
};

const Clientes = mongoose.model("Clientes", clienteSchema);
export default Clientes