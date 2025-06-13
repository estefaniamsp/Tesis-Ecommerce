import mongoose, { Schema, model } from "mongoose";

/**
 * Modelo simplificado de Ingrediente
 * - Se eliminan los campos `id_categoria` y `tipo_producto`.
 * - Ya no existe la validación condicional basada en la categoría.
 */
const ingredienteSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    imagen: {
      type: String, 
      required: true,
    },
    imagen_id: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    tipo: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.imagen_id;
      },
    },
  }
);

const Ingrediente = model("Ingredientes", ingredienteSchema);
export default Ingrediente;
