import Carrito from "../models/carritos.js";
import Clientes from "../models/clientes.js";
import Producto from "../models/productos.js";
import Ventas from "../models/ventas.js";
import mongoose from "mongoose";
import { Stripe } from "stripe";
const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

// Obtener todos los carritos
const getCarritoClienteController = async (req, res) => {
    try {
        const clienteId = req.clienteBDD._id;

        const carrito = await Carrito.findOne({ cliente_id: clienteId })
            .populate({
                path: 'productos.producto_id',
                populate: {
                    path: 'ingredientes',
                    model: 'Ingredientes',
                    select: 'nombre'
                }
            });

        if (!carrito) {
            return res.status(404).json({ msg: "No tienes un carrito asociado aún" });
        }

        return res.status(200).json({ carrito });
    } catch (error) {
        console.error("Error al obtener el carrito del cliente:", error);
        return res.status(500).json({ msg: "Error al obtener el carrito", error: error.message });
    }
};

// Crear un carrito
const addCarritoController = async (req, res) => {
    const { producto_id, cantidad } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!producto_id || typeof cantidad !== 'number' || cantidad <= 0) {
        return res.status(400).json({ msg: "Producto o cantidad inválida." });
    }

    try {
        const clienteExistente = await Clientes.findById(clienteId);
        if (!clienteExistente) {
            return res.status(404).json({ msg: "Cliente no encontrado" });
        }

        if (!mongoose.Types.ObjectId.isValid(producto_id.trim())) {
            return res.status(400).json({ msg: `ID de producto inválido: ${producto_id}` });
        }

        const producto = await Producto.findById(producto_id.trim());
        if (!producto) {
            return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
        }

        if (!producto.activo) {
            return res.status(400).json({ msg: `El producto ${producto.nombre} está descontinuado.` });
        }

        if (cantidad > producto.stock) {
            return res.status(400).json({
                msg: `Solo hay ${producto.stock} unidades disponibles del producto ${producto.nombre}.`
            });
        }

        const carrito = await Carrito.findOne({ cliente_id: clienteId, estado: "pendiente" });

        if (!carrito) {
            return res.status(400).json({ msg: "No tienes un carrito pendiente disponible. No se puede agregar productos." });
        }

        const subtotal = Math.round(producto.precio * cantidad * 100) / 100;
        // Verifica si el producto ya está
        const index = carrito.productos.findIndex(p => p.producto_id.toString() === producto._id.toString());

        if (index >= 0) {
            carrito.productos[index].cantidad += cantidad;
            carrito.productos[index].subtotal += subtotal;
        } else {
            carrito.productos.push({
                producto_id: producto._id,
                cantidad,
                precio_unitario: producto.precio,
                subtotal
            });
        }

        const totalCalculado = carrito.productos.reduce((acc, p) => acc + p.subtotal, 0);
        carrito.total = Math.round(totalCalculado * 100) / 100;
        await carrito.save();

        // ⚠️ Poblamos para devolver información completa del producto
        const carritoActualizado = await Carrito.findById(carrito._id)
            .populate({
                path: 'productos.producto_id',
                select: 'nombre imagen precio'
            });

        res.status(200).json({ msg: "Producto agregado al carrito", carrito: carritoActualizado });
    } catch (error) {
        console.error("Error al agregar producto al carrito:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

const updateCantidadProductoController = async (req, res) => {
    const { producto_id, cantidad } = req.body; // cantidad puede ser positiva o negativa
    const clienteId = req.clienteBDD._id.toString();

    if (!producto_id || typeof cantidad !== 'number') {
        return res.status(400).json({ msg: "Datos inválidos: producto_id y cantidad son requeridos." });
    }

    try {
        const carrito = await Carrito.findOne({ cliente_id: clienteId });
        if (!carrito) {
            return res.status(404).json({ msg: "Carrito no encontrado." });
        }

        const index = carrito.productos.findIndex(p => p.producto_id.toString() === producto_id);
        if (index === -1) {
            return res.status(404).json({ msg: "Producto no encontrado en el carrito." });
        }

        const producto = await Producto.findById(producto_id);
        if (!producto) {
            return res.status(404).json({ msg: "Producto no existe en la base de datos." });
        }

        if (cantidad < 0 && Math.abs(cantidad) > carrito.productos[index].cantidad) {
            return res.status(400).json({
                msg: `No puedes restar más de lo que tienes en el carrito. Actualmente tienes ${carrito.productos[index].cantidad} unidades de ${producto.nombre}.`
            });
        }

        const nuevaCantidad = carrito.productos[index].cantidad + cantidad;

        if (nuevaCantidad > producto.stock) {
            return res.status(400).json({
                msg: `No puedes agregar más de ${producto.stock} unidades de ${producto.nombre}.`
            });
        }

        let mensaje = "";

        if (nuevaCantidad <= 0) {
            carrito.productos.splice(index, 1);
            mensaje = `Producto eliminado del carrito: ${producto.nombre}`;
        } else {
            const subtotal = Math.round(producto.precio * nuevaCantidad * 100) / 100;
            carrito.productos[index].cantidad = nuevaCantidad;
            carrito.productos[index].subtotal = subtotal;
            mensaje = `Cantidad actualizada para el producto: ${producto.nombre}`;
        }

        // Recalcular total del carrito con redondeo
        const totalCalculado = carrito.productos.reduce((acc, p) => acc + p.subtotal, 0);
        carrito.total = Math.round(totalCalculado * 100) / 100;

        await carrito.save();

        res.status(200).json({ msg: mensaje, carrito });

    } catch (error) {
        console.error("Error al modificar cantidad:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

const removeProductoCarritoController = async (req, res) => {
    const { producto_id } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!producto_id || !mongoose.Types.ObjectId.isValid(producto_id.trim())) {
        return res.status(400).json({ msg: "ID de producto inválido." });
    }

    try {
        const carrito = await Carrito.findOne({ cliente_id: clienteId });
        if (!carrito) {
            return res.status(404).json({ msg: "Carrito no encontrado." });
        }

        // Filtra productos para eliminar el que coincide
        carrito.productos = carrito.productos.filter(
            (p) => p.producto_id.toString() !== producto_id
        );

        // Recalcula el total
        const totalCalculado = carrito.productos.reduce((acc, p) => acc + p.subtotal, 0);
        carrito.total = parseFloat(totalCalculado.toFixed(2));
        await carrito.save();

        res.status(200).json({ msg: "Producto eliminado del carrito", carrito });
    } catch (error) {
        console.error("Error al eliminar producto del carrito:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

// Vaciar carrito
const emptyCarritoController = async (req, res) => {
    const clienteId = req.clienteBDD._id.toString();

    try {
        const carrito = await Carrito.findOne({ cliente_id: clienteId });

        if (!carrito) {
            return res.status(404).json({ msg: "No se encontró un carrito asociado al cliente." });
        }

        // Vaciar el carrito
        carrito.productos = [];
        carrito.total = 0;
        carrito.estado = "pendiente";

        await carrito.save();

        return res.status(200).json({ msg: "El carrito fue vaciado exitosamente." });

    } catch (error) {
        console.error("Error al vaciar el carrito:", error);
        return res.status(500).json({
            msg: "Error interno del servidor",
            error: error.message
        });
    }
};

const pagarCarritoController = async (req, res) => {
    const clienteId = req.clienteBDD._id.toString();
    const { paymentMethodId, isTest } = req.body;

    if (!paymentMethodId) {
        return res.status(400).json({ msg: "paymentMethodId es requerido" });
    }

    try {
        const carrito = await Carrito.findOneAndUpdate(
            { cliente_id: clienteId, estado: "pendiente" },
            { estado: "procesando" },
            { new: true }
        ).populate("productos.producto_id");

        if (!carrito) {
            return res.status(400).json({ msg: "No se puede procesar el pago. El carrito ya fue pagado o no existe." });
        }

        if (carrito.productos.length === 0 || carrito.total <= 0) {
            carrito.estado = "pendiente";
            await carrito.save();
            return res.status(400).json({ msg: "No puedes pagar un carrito vacío." });
        }

        if (carrito.total < 0.5) {
            carrito.estado = "pendiente";
            await carrito.save();
            return res.status(400).json({ msg: "El total debe ser al menos $0.50 para procesar el pago." });
        }

        const cliente = await Clientes.findById(clienteId);

        let [stripeCliente] = (await stripe.customers.list({ email: cliente.email, limit: 1 })).data || [];

        if (!stripeCliente) {
            stripeCliente = await stripe.customers.create({
                name: `${cliente.nombre} ${cliente.apellido}`,
                email: cliente.email,
            });
        }

        let nuevaVenta = null;

        try {
            const payment = await stripe.paymentIntents.create({
                amount: Math.round(carrito.total * 100),
                currency: "USD",
                description: `Pago del carrito del cliente ${cliente.nombre}`,
                payment_method: paymentMethodId,
                confirm: true,
                customer: stripeCliente.id,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: "never"
                }
            });

            if (payment.status !== "succeeded") {
                throw new Error("El pago no fue exitoso");
            }

            // Procesar productos
            let totalVenta = 0;
            const productosConDetalles = [];

            for (const item of carrito.productos) {
                const producto = await Producto.findById(item.producto_id._id);

                if (!producto || !producto.activo) {
                    throw new Error(`El producto ${item.producto_id.nombre} ya no está disponible.`);
                }

                if (producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}`);
                }

                producto.stock -= item.cantidad;
                await producto.save();

                productosConDetalles.push({
                    producto_id: producto._id,
                    cantidad: item.cantidad,
                    subtotal: item.subtotal,
                });

                totalVenta += item.subtotal;
            }

            // Registrar venta
            nuevaVenta = new Ventas({
                cliente_id: cliente._id,
                productos: productosConDetalles,
                total: totalVenta,
                estado: "finalizado"
            });

            await nuevaVenta.save();

            // Limpiar carrito
            carrito.productos = [];
            carrito.total = 0;
            carrito.estado = "pendiente";
            await carrito.save();

            // Reembolso en modo prueba
            if (isTest === true) {
                if (totalVenta === 0.5) {
                    await stripe.refunds.create({
                        payment_intent: payment.id,
                        reason: "requested_by_customer"
                    });
                } else if (totalVenta > 0.5) {
                    const estimadoComision = totalVenta * 0.029 + 0.30;
                    const montoAReembolsar = totalVenta - estimadoComision;

                    if (montoAReembolsar > 0) {
                        await stripe.refunds.create({
                            payment_intent: payment.id,
                            amount: Math.round(montoAReembolsar * 100),
                            reason: "requested_by_customer"
                        });
                    }
                }
            }

            return res.status(200).json({
                msg: isTest
                    ? "Pago en modo prueba. Se aplicó reembolso automático."
                    : "Pago exitoso. Venta registrada correctamente.",
                venta: nuevaVenta
            });

        } catch (pagoError) {
            carrito.estado = "pendiente";
            await carrito.save();

            return res.status(400).json({
                msg: "El pago no pudo completarse. El carrito fue restaurado.",
                error: pagoError.message
            });
        }

    } catch (error) {
        console.error("Error al pagar el carrito:", error);
        return res.status(500).json({ msg: "Error al procesar el pago", error: error.message });
    }
};

export {
    getCarritoClienteController,
    addCarritoController,
    updateCantidadProductoController,
    removeProductoCarritoController,
    emptyCarritoController,
    pagarCarritoController
};
