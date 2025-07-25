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
      type: String, 
      required: true,
    },
    imagen_id: {
      type: String, 
      required: true,
    },
    resolucion: {
      type: String,
      required: true,
      enum: ["escritorio", "móvil"],
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
