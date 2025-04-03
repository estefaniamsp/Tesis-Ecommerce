import mongoose from 'mongoose';

const carritoSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    productos: [
        {
            producto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Producto',
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
        enum: ['activo', 'finalizado', 'abandonado'],
        default: 'activo'
    }
});

// Método para calcular el total del carrito y los subtotales de cada producto
carritoSchema.methods.calcularTotal = function() {
    let total = 0;
    this.productos.forEach(item => {
        item.subtotal = item.precio_unitario * item.cantidad;
        total += item.subtotal;
    });
    this.total = total;
};

// Pre-save hook para recalcular el total antes de guardar el carrito
carritoSchema.pre('save', function(next) {
    this.calcularTotal();
    next();
});

const Carrito = mongoose.model('Carrito', carritoSchema);

export default Carrito;
