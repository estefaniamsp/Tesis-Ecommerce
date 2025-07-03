import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const clienteSchema = new Schema(
  {
    cedula: {
      type: String,
      maxLength: 20,
      trim: true,
      sparse: true,
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
      sparse: true,
    },
    codigoRecuperacion: {
      type: String,
      default: null,
    },
    codigoRecuperacionExpires: {
      type: Date,
      default: null
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
    imagen: {
      type: String,
      required: false,
    },
    imagen_id: {
      type: String,
      required: false,
    },
    estado: {
      type: String,
      enum: ['activo', 'inactivo'],
      default: 'activo'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.imagen_id;
        delete ret.password;
        delete ret.token;
        delete ret.codigoRecuperacion;
        delete ret.codigoRecuperacionExpires;
        delete ret.confirmEmail;
      },
    },
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