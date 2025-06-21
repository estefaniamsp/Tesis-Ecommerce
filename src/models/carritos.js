import mongoose from 'mongoose';

const carritoSchema = new mongoose.Schema({
    cliente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clientes',
        required: true
    },
    productos: [
        {
            producto_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
                // Nota: el ref es dinámico según tipo_producto
            },
            tipo_producto: {
                type: String,
                enum: ['normal', 'personalizado', 'ia'],
                default: 'normal',
                required: true
            },
            cantidad: {
                type: Number,
                required: true,
                min: 1
            },
            precio_unitario: {
                type: Number,
                required: true
            },
            subtotal: {
                type: Number,
                required: true
            }
        }
    ],
    total: {
        type: Number,
        required: true
    },
    fecha_creacion: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: ['pendiente', 'pagado', 'procesando'],
        default: 'pendiente'
    },
},
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.__v;
                delete ret.createdAt;
                delete ret.updatedAt;
            },
        },
    });

// Método para calcular el total del carrito y los subtotales de cada producto
carritoSchema.methods.calcularTotal = function () {
    let total = 0;
    this.productos.forEach(item => {
        item.subtotal = item.precio_unitario * item.cantidad;
        total += item.subtotal;
    });
    this.total = total;
};

// Pre-save hook para recalcular el total antes de guardar el carrito
carritoSchema.pre('save', function (next) {
    this.calcularTotal();
    next();
});

const Carrito = mongoose.model('Carritos', carritoSchema);

export default Carrito;
