import Carrito from "../models/carritos.js";
import Clientes from "../models/clientes.js";
import Producto from "../models/productos.js";
import ProductoPersonalizado from "../models/productosPersonalizados.js";
import Ingrediente from "../models/ingredientes.js";
import mongoose from "mongoose";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

const getCarritoClienteController = async (req, res) => {
    try {
        const clienteId = req.clienteBDD._id;

        const carrito = await Carrito.findOne({
            cliente_id: clienteId,
            estado: { $in: ["pendiente", "procesando", "pagado"] },
        });

        if (!carrito) {
            return res.status(404).json({ msg: "No tienes un carrito asociado aún" });
        }

        const idsNormales = carrito.productos
            .filter((p) => p.tipo_producto === "normal")
            .map((p) => p.producto_id);

        const idsPersonalizados = carrito.productos
            .filter((p) => p.tipo_producto === "personalizado" || p.tipo_producto === "ia")
            .map((p) => p.producto_id);

        const [productosNormales, productosPersonalizados] = await Promise.all([
            Producto.find({ _id: { $in: idsNormales } }),
            ProductoPersonalizado.find({
                _id: { $in: idsPersonalizados },
                estado: { $in: ["en_carrito", "activo"] },
            }).populate("ingredientes"),
        ]);

        const productosEnriquecidos = carrito.productos.map((item) => {
            const encontrado = (
                item.tipo_producto === "normal" ? productosNormales : productosPersonalizados
            ).find((p) => p._id.toString() === item.producto_id.toString());

            return {
                ...item.toObject(),
                producto: encontrado || null,
            };
        });

        return res.status(200).json({
            carrito: {
                ...carrito.toObject(),
                productos: productosEnriquecidos,
            },
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

            if (!producto || producto.cliente_id.toString() !== clienteId) {
                return res
                    .status(404)
                    .json({ msg: "Producto personalizado no encontrado o no te pertenece" });
            }

            if (producto.estado === "comprado") {
                return res
                    .status(400)
                    .json({ msg: "Este producto ya fue comprado y no puede volver al carrito." });
            }

            if (["activo"].includes(producto.estado)) {
                producto.estado = "en_carrito";
                await producto.save();
            }
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

        const carrito = await Carrito.findOne({
            cliente_id: clienteId,
            estado: { $in: ["pendiente", "procesando", "pagado"] },
        });

        if (!carrito) {
            return res.status(400).json({ msg: "No tienes un carrito disponible." });
        }

        const index = carrito.productos.findIndex(
            (p) =>
                p.producto_id.toString() === producto._id.toString() && p.tipo_producto === tipo_producto
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
            carrito.productos[index].subtotal =
                Math.round(
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

        carrito.total =
            Math.round(carrito.productos.reduce((acc, p) => acc + p.subtotal, 0) * 100) / 100;
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
        const carrito = await Carrito.findOne({
            cliente_id: clienteId,
            estado: { $in: ["pendiente", "procesando", "pagado"] },
        });

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

        carrito.total =
            Math.round(carrito.productos.reduce((acc, p) => acc + p.subtotal, 0) * 100) / 100;
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
        const carrito = await Carrito.findOne({
            cliente_id: clienteId,
            estado: { $in: ["pendiente", "procesando", "pagado"] },
        });

        if (!carrito) return res.status(404).json({ msg: "Carrito no encontrado." });

        const productosIniciales = carrito.productos.length;

        carrito.productos = carrito.productos.filter(
            (p) => p.producto_id.toString() !== producto_id || p.tipo_producto !== tipo_producto
        );

        if (carrito.productos.length === productosIniciales) {
            return res
                .status(404)
                .json({ msg: "El producto no fue encontrado en el carrito con ese tipo." });
        }

        carrito.total = parseFloat(
            carrito.productos.reduce((acc, p) => acc + p.subtotal, 0).toFixed(2)
        );
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
        const carrito = await Carrito.findOne({
            cliente_id: clienteId,
            estado: { $in: ["pendiente", "procesando", "pagado"] },
        });

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

const crearIntentoPagoController = async (req, res) => {
    const clienteId = req.clienteBDD._id.toString();

    try {
        const cliente = await Clientes.findById(clienteId);
        if (!cliente) return res.status(404).json({ msg: "Cliente no encontrado" });

        const carrito = await Carrito.findOne({ cliente_id: clienteId, estado: "pendiente" });

        if (!carrito || carrito.total <= 0) return res.status(400).json({ msg: "Carrito vacío" });

        let [stripeCliente] =
            (await stripe.customers.list({ email: cliente.email, limit: 1 })).data || [];

        if (!stripeCliente) {
            stripeCliente = await stripe.customers.create({
                name: `${cliente.nombre} ${cliente.apellido}`,
                email: cliente.email,
            });
        }

        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: stripeCliente.id },
            {
                apiVersion: "2025-06-30.basil",
            }
        );

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(carrito.total * 100),
            currency: "USD",
            customer: stripeCliente.id,
            automatic_payment_methods: { enabled: true },
        });

        return res.status(200).json({
            paymentIntentClientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            ephemeralKey: ephemeralKey.secret,
            customer: stripeCliente.id,
        });
    } catch (error) {
        console.error("Error al crear intento de pago:", error.message);
        return res.status(500).json({ msg: "Error creando intento de pago", error: error.message });
    }
};

const finalizarPagoCarritoController = async (req, res) => {
    const clienteId = req.clienteBDD._id.toString();
    const { paymentIntentId, testing = false } = req.body;

    if (!paymentIntentId) {
        return res.status(400).json({ msg: "paymentIntentId es requerido." });
    }

    let carrito;

    try {
        // 1. Validar el Intento de pago
        if (!testing) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (!paymentIntent || paymentIntent.status !== "succeeded") {
                return res.status(400).json({ msg: "El pago no fue exitoso." });
            }
        }

        // 2. Buscar cliente y carrito pendiente
        const cliente = await Clientes.findById(clienteId);
        if (!cliente) return res.status(404).json({ msg: "Cliente no encontrado." });

        carrito = await Carrito.findOne({ cliente_id: clienteId, estado: "pendiente" });
        if (!carrito || carrito.productos.length === 0 || carrito.total <= 0) {
            return res.status(400).json({ msg: "Carrito inválido o vacío." });
        }

        // 3. Cambiar estado a "procesando"
        carrito.estado = "procesando";
        await carrito.save();

        // 4. Procesar productos del carrito
        const productosConDetalles = [];

        for (const item of carrito.productos) {
            let producto;

            if (item.tipo_producto === "personalizado" || item.tipo_producto === "ia") {
                producto = await ProductoPersonalizado.findById(item.producto_id).populate("ingredientes");

                if (!producto) throw new Error("Producto personalizado no encontrado");

                for (const ingrediente of producto.ingredientes) {
                    ingrediente.stock = Math.max(0, ingrediente.stock - item.cantidad);
                    await ingrediente.save();
                }

                producto.estado = "comprado";
                await producto.save();
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
                producto,
                cantidad: item.cantidad,
                subtotal: item.subtotal,
            });
        }

        // 5. Crear la venta
        const nuevaVenta = new (mongoose.model("Ventas"))({
            cliente_id: cliente._id,
            productos: productosConDetalles,
            total: carrito.total,
            estado: "pendiente",
        });

        await nuevaVenta.save();

        // 6. Formatear productos
        const productosEnVenta = productosConDetalles.map((item) => {
            if (item.producto.tipo_producto === "personalizado" || item.producto.tipo_producto === "ia") {
                const ingredientes =
                    item.producto.ingredientes?.map((ing) => ({
                        _id: ing._id,
                        nombre: ing.nombre,
                        imagen: ing.imagen,
                    })) || [];

                return {
                    cantidad: item.cantidad,
                    subtotal: item.subtotal,
                    producto: {
                        _id: item.producto._id,
                        tipo: item.producto.tipo_producto,
                        aroma: item.producto.aroma,
                        imagen: item.producto.imagen || null,
                        precio: item.producto.precio,
                        ingredientes,
                    },
                };
            } else {
                return {
                    cantidad: item.cantidad,
                    subtotal: item.subtotal,
                    producto: {
                        _id: item.producto._id,
                        nombre: item.producto.nombre,
                        descripcion: item.producto.descripcion,
                        imagen: item.producto.imagen,
                        precio: item.producto.precio,
                    },
                };
            }
        });

        // 7. Reiniciar el carrito
        carrito.productos = [];
        carrito.total = 0;
        carrito.estado = "pendiente";
        await carrito.save();

        // 8. Enviar respuesta
        const {
            password,
            token,
            codigoRecuperacion,
            codigoRecuperacionExpires,
            confirmEmail,
            estado,
            ...clienteSeguro
        } = cliente.toObject();

        return res.status(200).json({
            msg: "Compra finalizada correctamente.",
            venta: {
                _id: nuevaVenta._id,
                cliente_id: nuevaVenta.cliente_id,
                total: nuevaVenta.total,
                estado: nuevaVenta.estado,
                productos: productosEnVenta,
            },
            cliente: clienteSeguro,
        });
    } catch (error) {
        console.error(`[Carrito ${carrito?._id}] Error al finalizar pago:`, error.message);

        if (carrito && carrito.estado === "procesando") {
            try {
                carrito.estado = "pendiente";
                await carrito.save();
            } catch (e) {
                console.error("Error restaurando estado del carrito:", e.message);
            }
        }

        return res.status(500).json({ msg: "Error al finalizar la compra", error: error.message });
    }
};

export {
    getCarritoClienteController,
    addCarritoController,
    updateCantidadProductoController,
    removeProductoCarritoController,
    emptyCarritoController,
    crearIntentoPagoController,
    finalizarPagoCarritoController,
};
