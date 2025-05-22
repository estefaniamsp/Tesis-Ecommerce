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
    ingredientes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredientes",
        required: true
      }
    ],
    aroma: {
      type: String, // ej: "Vainilla"
      required: true,
    },
    tipo: {
      type: String, // ej: "Piel seca"
      required: true,
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
    activo: {
      type: Boolean,
      default: true,
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

const Producto = mongoose.model("Productos", productoSchema);
export default Producto;
