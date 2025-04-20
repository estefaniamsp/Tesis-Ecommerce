import mongoose, { Schema, model } from "mongoose";

const productoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      maxLength: 100,
      trim: true,
    },
    descripcion: {
      type: String,
      maxLength: 500,
      trim: true,
    },
    beneficios: {
      type: [String],
      validate: [array => array.length <= 3, "Máximo 3 beneficios"],
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    imagen: {
      type: String, // cloudinary
      required: true,
    },
    imagen_id: {
      type: String,
      required: false, 
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    descuento: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    id_categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorias",  // Referencia a la colección de categorías
      required: true,  // Cada producto debe pertenecer a una categoría
    },
  },
  { timestamps: true }
);

export default model("Productos", productoSchema);
