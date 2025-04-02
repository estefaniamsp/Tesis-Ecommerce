import mongoose, { Schema, model } from "mongoose";

const clienteSchema = new Schema(
    {
        cedula: {
            type: String,
            maxLength: 20,
            trim: true,
            required: true,
        },
        nombre: {
            type: String,
            maxLength: 20,
            trim: true,
            required: true,
        },
        apellido: {
            type: String,
            required: true,
            trim: true,
            maxLenght: 20,
        },
        ciudad: {
            type: String,
            required: true,
            trim: true,
            maxLenght: 10,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            maxLenght: 20,
            unique: true,
        },
        direccion: {
            type: String,
            required: true,
            trim: true,
            maxLenght: 30,
        },
        telefono: {
            type: String,
            required: true,
            trim: true,
            maxLenght: 10,
        },
        fecha_nacimiento: {
            type: String,
            required: true,
            trim: true,
            maxLenght: 20,
        }

    },
    { timestamps: true }
);

export default model("clientes", clienteSchema);

