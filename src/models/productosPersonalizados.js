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
        tipo_producto: {
            type: String,
            enum: [
                "piel seca",
                "piel grasa",
                "piel mixta",
                "decorativa",
                "aromatizante",
                "humidificación",
            ],
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

// Validación condicional de tipo_producto según categoría
productoPersonalizadoSchema.pre("save", async function (next) {
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
            !jabonesTipos.includes(this.tipo_producto)
        ) {
            return next(
                new Error("Tipo de producto inválido para la categoría 'Jabones artesanales'.")
            );
        }

        if (
            nombreCategoria.includes("velas") &&
            !velasTipos.includes(this.tipo_producto)
        ) {
            return next(
                new Error("Tipo de producto inválido para la categoría 'Velas artesanales'.")
            );
        }

        next();
    } catch (error) {
        next(error);
    }
});

const ProductoPersonalizado = model("ProductosPersonalizados", productoPersonalizadoSchema);

export default ProductoPersonalizado;
