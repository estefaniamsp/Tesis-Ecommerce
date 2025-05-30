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

        const subtotal = producto.precio * cantidad;

        // Busca o crea carrito
        let carrito = await Carrito.findOne({ cliente_id: clienteId });
        if (!carrito) {
            carrito = new Carrito({ cliente_id: clienteId, productos: [], total: 0, estado: "pendiente" });
        }

        // Verifica si el producto ya está
        const index = carrito.productos.findIndex(p => p.producto_id.toString() === producto._id.toString());

        if (index >= 0) {
            // Ya existe: actualiza cantidad y subtotal
            carrito.productos[index].cantidad += cantidad;
            carrito.productos[index].subtotal += subtotal;
        } else {
            // No existe: añade nuevo
            carrito.productos.push({
                producto_id: producto._id,
                cantidad,
                precio_unitario: producto.precio,
                subtotal
            });
        }

        // Recalcula total
        carrito.total = carrito.productos.reduce((acc, p) => acc + p.subtotal, 0);
        await carrito.save();

        res.status(200).json({ msg: "Producto agregado al carrito", carrito });
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
            carrito.productos[index].cantidad = nuevaCantidad;
            carrito.productos[index].subtotal = nuevaCantidad * producto.precio;
            mensaje = `Cantidad actualizada para el producto: ${producto.nombre}`;
        }

        // Recalcular total del carrito
        carrito.total = carrito.productos.reduce((acc, p) => acc + p.subtotal, 0);
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
        carrito.total = carrito.productos.reduce((acc, p) => acc + p.subtotal, 0);
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

export {
    getCarritoClienteController,
    addCarritoController,
    updateCantidadProductoController,
    removeProductoCarritoController,
    emptyCarritoController
};
