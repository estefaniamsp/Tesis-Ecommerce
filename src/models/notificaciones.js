import { Schema, model, Types } from "mongoose";

const notificationsSchema = new Schema(
  {
    clientes: [
      {
        type: Types.ObjectId,
        ref: "Clientes",
        required: true,
      },
    ],
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxLength: 50,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    imagen: {
      type: String,
      trim: true,
      maxLength: 200,
    },
    fechaEnvio: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
      },
    },
  }
);

const Notificaciones = model("Notificaciones", notificationsSchema);
export default Notificaciones;
