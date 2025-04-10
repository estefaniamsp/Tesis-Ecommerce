import mongoose from 'mongoose';

const ventaSchema = new mongoose.Schema(
    {
        cliente_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clientes', 
            required: true,
        },
        productos: [{
            producto_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Productos', 
                required: true,
            },
            cantidad: {
                type: Number,
                required: true,
                min: 1,
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

const Venta = mongoose.model('Ventas', ventaSchema);

export default Venta;
