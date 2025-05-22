import mongoose, { Schema, model } from "mongoose";

const ingredienteSchema = new Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100,
        },
        imagen: {
            type: String, // URL segura de Cloudinary
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
        id_categoria: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categorias",
            required: true,
        },
        precio: {
            type: Number,
            required: true,
            min: 0,
        },
        tipo: {
            type: String,
            required: true,
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
