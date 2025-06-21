import Carrito from "../models/carritos.js";
import Clientes from "../models/clientes.js";
import Producto from "../models/productos.js";
import ProductoPersonalizado from "../models/productosPersonalizados.js";
import mongoose from "mongoose";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

const getCarritoClienteController = async (req, res) => {
    try {
        const clienteId = req.clienteBDD._id;

        const carrito = await Carrito.findOne({ cliente_id: clienteId });

        if (!carrito) {
            return res.status(404).json({ msg: "No tienes un carrito asociado aún" });
        }

        // Separar por tipo de producto
        const idsNormales = carrito.productos
            .filter(p => p.tipo_producto === "normal")
            .map(p => p.producto_id);

        const idsPersonalizados = carrito.productos
            .filter(p => p.tipo_producto === "personalizado" || p.tipo_producto === "ia")
            .map(p => p.producto_id);

        const [productosNormales, productosPersonalizados] = await Promise.all([
            Producto.find({ _id: { $in: idsNormales } }),
            ProductoPersonalizado.find({ _id: { $in: idsPersonalizados } }).populate("ingredientes"),
        ]);

        // Enlazar detalles de producto al carrito
        const productosEnriquecidos = carrito.productos.map(item => {
            const encontrado = (item.tipo_producto === "normal"
                ? productosNormales
                : productosPersonalizados
            ).find(p => p._id.toString() === item.producto_id.toString());

            return {
                ...item.toObject(),
                producto: encontrado || null,
            };
        });

        return res.status(200).json({
            carrito: {
                ...carrito.toObject(),
                productos: productosEnriquecidos,
            }
        });
    } catch (error) {
        console.error("Error al obtener el carrito del cliente:", error);
        return res.status(500).json({ msg: "Error al obtener el carrito", error: error.message });
    }
};

const addCarritoController = async (req, res) => {
    const { producto_id, cantidad, tipo_producto = "normal" } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!producto_id || typeof cantidad !== "number" || cantidad <= 0) {
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

        let producto;
        if (tipo_producto === "personalizado" || tipo_producto === "ia") {
            producto = await ProductoPersonalizado.findById(producto_id.trim());
        } else {
            producto = await Producto.findById(producto_id.trim());
        }

        if (!producto) {
            return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
        }

        if (tipo_producto === "normal") {
            if (!producto.activo || producto.stock === 0) {
                return res.status(400).json({ msg: `El producto ${producto.nombre} no está disponible.` });
            }
        }

        const carrito = await Carrito.findOne({ cliente_id: clienteId, estado: "pendiente" });
        if (!carrito) {
            return res.status(400).json({ msg: "No tienes un carrito pendiente disponible." });
        }

        const index = carrito.productos.findIndex(
            (p) => p.producto_id.toString() === producto._id.toString() && p.tipo_producto === tipo_producto
        );

        let nuevaCantidadTotal = cantidad;
        if (index >= 0) {
            nuevaCantidadTotal += carrito.productos[index].cantidad;
        }

        if (tipo_producto === "normal" && nuevaCantidadTotal > producto.stock) {
            return res.status(400).json({ msg: `Solo hay ${producto.stock} unidades disponibles.` });
        }

        const subtotal = Math.round(producto.precio * cantidad * 100) / 100;

        if (index >= 0) {
            carrito.productos[index].cantidad += cantidad;
            carrito.productos[index].subtotal = Math.round(
                carrito.productos[index].cantidad * carrito.productos[index].precio_unitario * 100
            ) / 100;
        } else {
            carrito.productos.push({
                producto_id: producto._id,
                tipo_producto,
                cantidad,
                precio_unitario: producto.precio,
                subtotal,
            });
        }

        carrito.total = Math.round(carrito.productos.reduce((acc, p) => acc + p.subtotal, 0) * 100) / 100;
        await carrito.save();

        return res.status(200).json({ msg: "Producto agregado al carrito", carrito });
    } catch (error) {
        console.error("Error al agregar producto al carrito:", error);
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
};

const updateCantidadProductoController = async (req, res) => {
    const { producto_id, cantidad, tipo_producto = "normal" } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!producto_id || typeof cantidad !== "number") {
        return res.status(400).json({ msg: "Datos inválidos." });
    }

    try {
        const carrito = await Carrito.findOne({ cliente_id: clienteId });
        if (!carrito) return res.status(404).json({ msg: "Carrito no encontrado." });

        const index = carrito.productos.findIndex(
            (p) => p.producto_id.toString() === producto_id && p.tipo_producto === tipo_producto
        );
        if (index === -1) return res.status(404).json({ msg: "Producto no encontrado en el carrito." });

        let producto;
        if (tipo_producto === "personalizado" || tipo_producto === "ia") {
            producto = await ProductoPersonalizado.findById(producto_id);
        } else {
            producto = await Producto.findById(producto_id);
        }

        if (!producto) return res.status(404).json({ msg: "Producto no encontrado." });

        if (tipo_producto === "normal") {
            if (!producto.activo || producto.stock === 0) {
                return res.status(400).json({ msg: `El producto ${producto.nombre} no está disponible.` });
            }
        }

        const nuevaCantidad = carrito.productos[index].cantidad + cantidad;

        if (tipo_producto === "normal" && nuevaCantidad > producto.stock) {
            return res.status(400).json({ msg: `No puedes agregar más de ${producto.stock} unidades.` });
        }

        let mensaje = "";

        if (nuevaCantidad <= 0) {
            carrito.productos.splice(index, 1);
            mensaje = `Producto eliminado del carrito: ${producto.nombre}`;
        } else {
            const subtotal = Math.round(producto.precio * nuevaCantidad * 100) / 100;
            carrito.productos[index].cantidad = nuevaCantidad;
            carrito.productos[index].subtotal = subtotal;
            mensaje = `Cantidad actualizada para: ${producto.nombre}`;
        }

        carrito.total = Math.round(carrito.productos.reduce((acc, p) => acc + p.subtotal, 0) * 100) / 100;
        await carrito.save();

        res.status(200).json({ msg: mensaje, carrito });
    } catch (error) {
        console.error("Error al modificar cantidad:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

const removeProductoCarritoController = async (req, res) => {
    const { producto_id, tipo_producto } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!producto_id || !tipo_producto) {
        return res.status(400).json({ msg: "Debes proporcionar producto_id y tipo_producto." });
    }

    if (!mongoose.Types.ObjectId.isValid(producto_id.trim())) {
        return res.status(400).json({ msg: "ID de producto inválido." });
    }

    try {
        const carrito = await Carrito.findOne({ cliente_id: clienteId });
        if (!carrito) return res.status(404).json({ msg: "Carrito no encontrado." });

        const productosIniciales = carrito.productos.length;

        carrito.productos = carrito.productos.filter(
            (p) => p.producto_id.toString() !== producto_id || p.tipo_producto !== tipo_producto
        );

        if (carrito.productos.length === productosIniciales) {
            return res.status(404).json({ msg: "El producto no fue encontrado en el carrito con ese tipo." });
        }

        carrito.total = parseFloat(carrito.productos.reduce((acc, p) => acc + p.subtotal, 0).toFixed(2));
        await carrito.save();

        return res.status(200).json({ msg: "Producto eliminado del carrito", carrito });
    } catch (error) {
        console.error("Error al eliminar producto del carrito:", error);
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
};

const emptyCarritoController = async (req, res) => {
    const clienteId = req.clienteBDD._id.toString();

    try {
        const carrito = await Carrito.findOne({ cliente_id: clienteId });
        if (!carrito) return res.status(404).json({ msg: "Carrito no encontrado." });

        carrito.productos = [];
        carrito.total = 0;
        carrito.estado = "pendiente";
        await carrito.save();

        return res.status(200).json({ msg: "El carrito fue vaciado exitosamente." });
    } catch (error) {
        console.error("Error al vaciar el carrito:", error);
        return res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
};

const pagarCarritoController = async (req, res) => {
    const clienteId = req.clienteBDD._id.toString();
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
        return res.status(400).json({ msg: "paymentMethodId es requerido" });
    }

    try {
        const carrito = await Carrito.findOneAndUpdate(
            { cliente_id: clienteId, estado: "pendiente" },
            { estado: "procesando" },
            { new: true }
        );

        if (!carrito || carrito.productos.length === 0 || carrito.total <= 0) {
            return res.status(400).json({ msg: "No se puede procesar el carrito." });
        }

        const cliente = await Clientes.findById(clienteId);
        let [stripeCliente] = (await stripe.customers.list({ email: cliente.email, limit: 1 })).data || [];
        if (!stripeCliente) {
            stripeCliente = await stripe.customers.create({
                name: `${cliente.nombre} ${cliente.apellido}`,
                email: cliente.email,
            });
        }

        const payment = await stripe.paymentIntents.create({
            amount: Math.round(carrito.total * 100),
            currency: "USD",
            description: `Pago del carrito del cliente ${cliente.nombre}`,
            payment_method: paymentMethodId,
            confirm: true,
            customer: stripeCliente.id,
            automatic_payment_methods: { enabled: true, allow_redirects: "never" }
        });

        if (payment.status !== "succeeded") throw new Error("El pago no fue exitoso");

        const productosConDetalles = [];
        for (const item of carrito.productos) {
            let producto;
            if (item.tipo_producto === "personalizado" || item.tipo_producto === "ia") {
                producto = await ProductoPersonalizado.findById(item.producto_id);
            } else {
                producto = await Producto.findById(item.producto_id);
                if (!producto || producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente o producto no disponible: ${producto?.nombre}`);
                }
                producto.stock -= item.cantidad;
                await producto.save();
            }

            productosConDetalles.push({
                producto_id: producto._id,
                cantidad: item.cantidad,
                subtotal: item.subtotal,
            });
        }

        const nuevaVenta = new (mongoose.model("Ventas"))({
            cliente_id: cliente._id,
            productos: productosConDetalles,
            total: carrito.total,
            estado: "finalizado"
        });
        await nuevaVenta.save();

        carrito.productos = [];
        carrito.total = 0;
        carrito.estado = "pendiente";
        await carrito.save();

        return res.status(200).json({ msg: "Pago exitoso.", venta: nuevaVenta });
    } catch (error) {
        console.error("Error al pagar el carrito:", error);
        await Carrito.updateOne({ cliente_id: clienteId }, { estado: "pendiente" });
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