import Carritos from "../models/carritos.js";
import Clientes from "../models/clientes.js";
import Producto from "../models/productos.js";
import mongoose from "mongoose";

// Obtener todos los carritos
const getAllCarritosController = async (req, res) => {
    try {
        const clienteId = req.clienteBDD._id;

        // Paginación
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;

        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        const skip = (page - 1) * limit;

        // Buscar solo los carritos de ese cliente
        const carritos = await Carritos.find({ cliente_id: clienteId })
            .populate({
                path: 'cliente_id',
                select: '-password -codigoRecuperacionExpires -codigoRecuperacion -token -confirmEmail -createdAt -updatedAt -__v'
            })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // opcional: carritos más recientes primero

        const totalCarritos = await Carritos.countDocuments({ cliente_id: clienteId });
        const totalPaginas = Math.ceil(totalCarritos / limit);

        if (carritos.length === 0) {
            return res.status(404).json({ msg: "No se encontraron carritos asociados a tu cuenta" });
        }

        return res.status(200).json({
            totalCarritos,
            totalPaginas,
            paginaActual: page,
            carritos
        });
    } catch (error) {
        console.error("Error al obtener carritos:", error);
        return res.status(500).json({ msg: "Error al obtener los carritos", error: error.message });
    }
};

// Obtener un carrito por ID
const getCarritoByIDController = async (req, res) => {
    const { id } = req.params;
    const usuario = req.clienteBDD;

    try {
        // Buscar el carrito
        const carrito = await Carritos.findById(id)

            .populate('productos.producto_id');

        // Si no existe el carrito
        if (!carrito) {
            return res.status(404).json({ msg: "Carrito no encontrado" });
        }

        // Verificar si el carrito pertenece al cliente logueado
        if (carrito.cliente_id._id.toString() !== usuario._id.toString()) {
            return res.status(403).json({ msg: "No tienes permiso para ver este carrito" });
        }

        // Devolver el carrito si todo está bien
        res.status(200).json(carrito);

    } catch (error) {
        console.error("Error al obtener carrito por ID:", error);
        res.status(500).json({ msg: "Error al obtener el carrito", error: error.message });
    }
};

// Crear un carrito
const createCarritoController = async (req, res) => {
    const { productos } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!productos || productos.length === 0) {
        return res.status(400).json({ msg: "Debes agregar al menos un producto" });
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

            if (!producto_id || !cantidad) {
                return res.status(400).json({ msg: "Falta producto o cantidad en uno de los productos." });
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

        const nuevoCarrito = new Carritos({
            cliente_id: clienteId,
            productos: productosConDetalles,
            total: totalCarrito,
            estado: "pendiente",
        });

        await nuevoCarrito.save();

        // Actualizar disponibilidad
        const productosConDisponibilidad = await Promise.all(
            nuevoCarrito.productos.map(async (p) => {
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
            ...nuevoCarrito._doc,
            productos: productosConDisponibilidad
        };

        res.status(201).json({
            msg: "Carrito creado exitosamente",
            carrito: carritoFinal
        });

    } catch (error) {
        console.error("Error al crear carrito:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

// Actualizar un carrito
const updateCarritoController = async (req, res) => {
    const { id } = req.params;
    const { productos, estado } = req.body;
    const clienteId = req.clienteBDD._id.toString();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de carrito no válido" });
    }

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ msg: "Debes enviar al menos un producto válido" });
    }

    try {
        const carrito = await Carritos.findById(id);
        if (!carrito) {
            return res.status(404).json({ msg: "Carrito no encontrado" });
        }

        if (carrito.cliente_id.toString() !== clienteId) {
            return res.status(403).json({ msg: "No tienes permisos para modificar este carrito" });
        }

        const productosProcesados = [];
        let total = 0;

        for (const item of productos) {
            const { producto_id, cantidad } = item;

            if (
                !producto_id ||
                typeof producto_id !== "string" ||
                !mongoose.Types.ObjectId.isValid(producto_id.trim())
            ) {
                return res.status(400).json({ msg: `ID de producto inválido: ${producto_id}` });
            }

            if (!cantidad || typeof cantidad !== "number" || cantidad <= 0) {
                return res.status(400).json({ msg: `Cantidad inválida para producto: ${producto_id}` });
            }

            const producto = await Producto.findById(producto_id.trim());
            if (!producto) {
                return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
            }

            if (!producto.activo) {
                return res.status(400).json({ msg: `El producto ${producto.nombre} está descontinuado y no puede ser añadido al carrito.` });
            }

            if (producto.stock < cantidad) {
                return res.status(400).json({
                    msg: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, solicitado: ${cantidad}`
                });
            }

            const precio_unitario = producto.precio;
            const subtotal = precio_unitario * cantidad;
            total += subtotal;

            productosProcesados.push({
                producto_id: producto._id,
                cantidad,
                precio_unitario,
                subtotal
            });
        }

        carrito.productos = productosProcesados;
        carrito.total = total;
        carrito.estado = estado || carrito.estado;

        await carrito.save();

        res.status(200).json({
            msg: "Carrito actualizado con éxito",
            carrito
        });

    } catch (error) {
        console.error("Error al actualizar carrito:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};

// Eliminar un carrito
const deleteCarritoController = async (req, res) => {
    const { id } = req.params;
    const clienteId = req.clienteBDD._id.toString();

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "El carrito no existe" });
    }

    try {
        const carrito = await Carritos.findById(id);

        if (!carrito) {
            return res.status(404).json({ msg: "Carrito no encontrado" });
        }

        // Validar que el carrito pertenece al cliente autenticado
        if (carrito.cliente_id.toString() !== clienteId) {
            return res.status(403).json({ msg: "No tienes permisos para eliminar este carrito" });
        }

        await carrito.deleteOne();

        res.status(200).json({ msg: `El carrito con id ${id} fue eliminado exitosamente` });
    } catch (error) {
        console.error("Error al eliminar carrito:", error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
};


export {
    getAllCarritosController,
    getCarritoByIDController,
    createCarritoController,
    updateCarritoController,
    deleteCarritoController
};
