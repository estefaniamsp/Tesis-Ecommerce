import Carrito from "../models/carritos.js";
import Clientes from "../models/clientes.js";
import Producto from "../models/productos.js";
import mongoose from "mongoose";

// Obtener todos los carritos
const getCarritoClienteController = async (req, res) => {
    try {
        const clienteId = req.clienteBDD._id;

        const carrito = await Carrito.findOne({ cliente_id: clienteId })
            .populate('productos.producto_id');

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
const setCarritoController = async (req, res) => {
    const { productos } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!productos || productos.length === 0) {
        return res.status(400).json({ msg: `Debes agregar al menos un producto` });
    }

    try {
        const clienteExistente = await Clientes.findById(clienteId);
        if (!clienteExistente) {
            return res.status(404).json({ msg: "Cliente no encontrado" });
        }

        let totalCarrito = 0;
        const productosConDetalles = [];

        for (const item of productos) {
            const { producto_id, cantidad } = item;

            if (!producto_id || typeof cantidad !== 'number' || cantidad <= 0) {
                return res.status(400).json({ msg: `Producto o cantidad inválida en uno de los productos.` });
            }

            if (typeof producto_id !== "string" || !mongoose.Types.ObjectId.isValid(producto_id.trim())) {
                return res.status(400).json({ msg: `ID de producto inválido: ${producto_id}` });
            }

            const producto = await Producto.findById(producto_id.trim());
            if (!producto) {
                return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
            }

            if (!producto.activo) {
                return res.status(400).json({ msg: `El producto ${producto.nombre} está descontinuado y no puede ser añadido al carrito.` });
            }

            const subtotal = producto.precio * cantidad;
            totalCarrito += subtotal;

            productosConDetalles.push({
                producto_id: producto._id,
                cantidad,
                precio_unitario: producto.precio,
                subtotal
            });
        }

        let carrito = await Carrito.findOne({ cliente_id: clienteId });
        const mensaje = carrito ? "Carrito actualizado exitosamente" : "Carrito creado exitosamente";

        if (!carrito) {
            carrito = new Carrito({ cliente_id: clienteId });
        }

        carrito.productos = productosConDetalles;
        carrito.total = totalCarrito;
        carrito.estado = "pendiente";

        await carrito.save();

        // Actualizar disponibilidad
        const productosConDisponibilidad = await Promise.all(
            carrito.productos.map(async (p) => {
                const producto = await Producto.findById(p.producto_id);
                return {
                    producto_id: p.producto_id,
                    cantidad: p.cantidad,
                    precio_unitario: p.precio_unitario,
                    subtotal: p.subtotal,
                    disponible: producto ? producto.stock >= p.cantidad : false
                };
            })
        );

        const carritoFinal = {
            ...carrito._doc,
            productos: productosConDisponibilidad
        };

        res.status(201).json({
            msg: mensaje,
            carrito: carritoFinal
        });

    } catch (error) {
        console.error("Error al crear/actualizar carrito:", error);
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

export {
    getCarritoClienteController,
    setCarritoController,
    emptyCarritoController
};
