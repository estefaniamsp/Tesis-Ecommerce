import mongoose, { Schema, model } from "mongoose";

const vistaProductoSchema = new Schema({
    cliente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clientes",
        required: true,
    },
    producto_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Productos",
        required: true,
    },
    fecha: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

const VistaProducto = model("VistaProducto", vistaProductoSchema);
export default VistaProducto;
