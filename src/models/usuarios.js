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
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

usuarioSchema.methods.encrypPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  const passwordEncryp = await bcrypt.hash(password, salt);
  return passwordEncryp;
};

usuarioSchema.methods.matchPassword = async function (password) {
  const response = await bcrypt.compare(password, this.password);
  return response;
};

export default model("usuarios", usuarioSchema);