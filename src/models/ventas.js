import mongoose from 'mongoose';

const ventaSchema = new mongoose.Schema(
    {
        cliente_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cliente', 
            required: true,
        },
        productos: [{
            producto_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Producto', 
                required: true,
            },
            cantidad: {
                type: Number,
                required: true,
                min: 1,
            },
            precio_unitario: {
                type: Number,
                required: true,
            },
            subtotal: {
                type: Number,
                required: true,
            }
        }],
        total: {
            type: Number,
            required: true,
        },
        fecha_venta: {
            type: Date,
            default: Date.now,
        },
        estado: {
            type: String,
            enum: ['pendiente', 'completada', 'cancelada'],
            default: 'pendiente',
        }
    },
    { timestamps: true }
);

const Venta = mongoose.model('Venta', ventaSchema);

export default Venta;
