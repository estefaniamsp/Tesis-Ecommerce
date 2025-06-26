import mongoose, { Schema, model } from "mongoose";

const productoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      maxLength: 100,
      unique: true,
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
        required: true,
      },
    ],
    aroma: {
      type: String, 
      required: true,
    },
    tipo: {
      type: String, 
      required: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
      min: 1,
      max: 1000,
    },
    imagen: {
      type: String, // URL de Cloudinary
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
      max: 100,
    },
    descuento: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    id_categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorias",
      required: true,
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
        delete ret.imagen_id;
      },
    },
  }
);

// Validación condicional de tipo por categoría
productoSchema.pre("save", async function (next) {
  const jabonesTipos = ["piel seca", "piel grasa", "piel mixta"];
  const velasTipos = ["decorativa", "aromatizante", "humidificación"];

  try {
    const categoria = await mongoose
      .model("Categorias")
      .findById(this.id_categoria);

    if (!categoria) {
      return next(new Error("Categoría no encontrada."));
    }

    const nombreCategoria = categoria.nombre.toLowerCase();

    if (
      nombreCategoria.includes("jabones") &&
      !jabonesTipos.includes(this.tipo)
    ) {
      return next(
        new Error("Tipo inválido para la categoría 'Jabones artesanales'.")
      );
    }

    if (
      nombreCategoria.includes("velas") &&
      !velasTipos.includes(this.tipo)
    ) {
      return next(
        new Error("Tipo inválido para la categoría 'Velas artesanales'.")
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Producto = model("Productos", productoSchema);
export default Producto;
