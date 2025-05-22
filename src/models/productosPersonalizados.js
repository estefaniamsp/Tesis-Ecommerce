import mongoose from 'mongoose';

const productoPersonalizadoSchema = new mongoose.Schema(
    {
        cliente_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clientes',
            required: true
        },
        ingredientes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Ingredientes",
                required: true
            }
        ],
        id_categoria: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categorias",  // Referencia a la colección de categorías
            required: true,  // Cada producto debe pertenecer a una categoría
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

const ProductoPersonalizado = mongoose.model('ProductosPersonalizados', productoPersonalizadoSchema);

export default ProductoPersonalizado;
