import mongoose, { Schema, model } from "mongoose";

const productoPersonalizadoSchema = new Schema(
    {
        cliente_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Clientes",
            required: true,
        },
        ingredientes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Ingredientes",
                required: true,
            },
        ],
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
        imagen: {
            type: String,
            required: false,
        },
        imagen_id: {
            type: String,
            required: false,
        },
        aroma: {
            type: String,
            required: true,
            maxLength: 100,
            trim: true,
        },
        estado: {
            type: String,
            enum: ["activo", "en_carrito", "comprado", "guardado", "eliminado"],
            default: "activo"
        },
        tipo_producto: {
            type: String,
            enum: ["personalizado", "ia"],
            default: "personalizado",
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

const ProductoPersonalizado = model("ProductosPersonalizados", productoPersonalizadoSchema);

export default ProductoPersonalizado;
