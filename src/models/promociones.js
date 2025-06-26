import mongoose from "mongoose";

const promocionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    imagen: {
      type: String, // URL de la imagen subida a Cloudinary
      required: true,
    },
    imagen_id: {
      type: String, // ID que Cloudinary devuelve para poder eliminar la imagen después
      required: true,
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

const Promocion = mongoose.model("Promociones", promocionSchema);

export default Promocion;
