import mongoose from "mongoose";

const promocionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },
    imagen: {
      type: String, // URL de la imagen subida a Cloudinary
      required: true,
    },
    imagen_id: {
      type: String, // ID que Cloudinary devuelve para poder eliminar la imagen después
      required: true,
    },
    fecha_inicio: {
      type: Date,
      required: true,
    },
    fecha_fin: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Promocion = mongoose.model("Promociones", promocionSchema);

export default Promocion;
