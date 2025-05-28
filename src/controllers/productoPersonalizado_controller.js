import ProductoPersonalizado from "../models/productosPersonalizados.js";
import Ingrediente from "../models/ingredientes.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// Obtener todos los productos personalizados del usuario autenticado
const getAllProductosPersonalizadosController = async (req, res) => {
    try {

        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Acceso denegado: solo los clientes pueden ver sus productos personalizados." });
        }

        const clienteId = req.clienteBDD._id;

        // Paginación (opcional, si deseas agregarla)
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;

        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        const skip = (page - 1) * limit;

        const productos = await ProductoPersonalizado.find({ cliente_id: clienteId })
            .populate("ingredientes")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalProductos = await ProductoPersonalizado.countDocuments({ cliente_id: clienteId });
        const totalPaginas = Math.ceil(totalProductos / limit);

        if (productos.length === 0) {
            return res.status(404).json({ msg: "No tienes productos personalizados aún." });
        }

        return res.status(200).json({
            totalProductos,
            totalPaginas,
            paginaActual: page,
            productos
        });

    } catch (error) {
        console.error("Error al obtener los productos personalizados:", error);
        return res.status(500).json({ msg: "Error al obtener los productos personalizados", error: error.message || error });
    }
};

// Obtener un producto personalizado por ID
const getProductoPersonalizadoByIDController = async (req, res) => {
    const { id } = req.params;
    const usuario = req.clienteBDD._id.toString();

    try {

        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Acceso denegado: solo los clientes pueden ver productos personalizados." });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID no válido" });
        }

        const producto = await ProductoPersonalizado.findById(id).populate("ingredientes");

        if (!producto) {
            return res.status(404).json({ msg: "Producto personalizado no encontrado" });
        }

        if (!producto.cliente_id || producto.cliente_id.toString() !== usuario) {
            return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
        }

        return res.status(200).json({ producto });

    } catch (error) {
        console.error("Error al obtener producto personalizado:", error.message || error);
        return res.status(500).json({ msg: "Error al obtener el producto", error: error.message || "Error desconocido" });
    }
};

// Crear un nuevo producto personalizado
const createProductoPersonalizadoController = async (req, res) => {
    try {

        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Solo los clientes pueden crear productos personalizados." });
        }

        let { ingredientes, tipo, id_categoria } = req.body;

        console.log("📦 Datos recibidos:", { ingredientes, tipo, id_categoria });

        if (!ingredientes) {
            return res.status(400).json({ msg: "Debe haber al menos un ingrediente." });
        }

        if (typeof ingredientes === "string") {
            ingredientes = [ingredientes];
        }

        if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
            return res.status(400).json({ msg: "Debe haber al menos un ingrediente." });
        }

        if (!tipo || !tipo.trim()) {
            return res.status(400).json({ msg: "El campo 'tipo' es obligatorio (ej: 'jabón' o 'vela')." });
        }

        if (!id_categoria || !mongoose.Types.ObjectId.isValid(id_categoria)) {
            return res.status(400).json({ msg: "ID de categoría no válido." });
        }

        const ingredientesEnBD = await Ingrediente.find({ _id: { $in: ingredientes } });
        if (ingredientesEnBD.length !== ingredientes.length) {
            return res.status(400).json({ msg: "Uno o más ingredientes no existen en la base de datos." });
        }

        if (!req.file) {
            return res.status(400).json({ msg: "La imagen del producto personalizado es obligatoria." });
        }

        const precio = ingredientesEnBD.reduce((total, ing) => total + ing.precio, 0);

        // Crear producto
        const nuevoProducto = new ProductoPersonalizado({
            cliente_id: req.clienteBDD._id,
            ingredientes,
            tipo: tipo.trim().toLowerCase(),
            id_categoria,
            precio,
            imagen: req.file.path,
            imagen_id: req.file.filename,
        });

        await nuevoProducto.save();

        return res.status(201).json({
            msg: "Producto personalizado creado exitosamente",
            producto: await nuevoProducto.populate("ingredientes"),
        });

    } catch (error) {
        console.error("Error al crear el producto personalizado:", error);

        if (req.file?.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (error) {
                console.warn("No se pudo eliminar la imagen tras error:", error.message);
            }
        }

        return res.status(500).json({ msg: "Error al crear el producto personalizado", error: error.message });
    }
};

// Actualizar un producto personalizado
const updateProductoPersonalizadoController = async (req, res) => {
    const { id } = req.params;
    let { ingredientes } = req.body;

    try {
        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Solo los clientes pueden actualizar productos personalizados." });
        }

        const cliente = req.clienteBDD;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID de producto no válido" });
        }

        const producto = await ProductoPersonalizado.findById(id);
        if (!producto) {
            return res.status(404).json({ msg: "Producto personalizado no encontrado" });
        }

        if (!producto.cliente_id || producto.cliente_id.toString() !== cliente._id.toString()) {
            return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
        }

        if (typeof ingredientes === "string") {
            ingredientes = [ingredientes];
        }

        if (ingredientes && Array.isArray(ingredientes)) {
            const ingredientesDB = await Ingrediente.find({ _id: { $in: ingredientes } });
            if (ingredientesDB.length !== ingredientes.length) {
                return res.status(400).json({ msg: "Uno o más ingredientes no son válidos" });
            }

            producto.ingredientes = ingredientes;
            producto.precio = ingredientesDB.reduce((acc, ing) => acc + ing.precio, 0);
        }

        if (req.file) {
            if (producto.imagen_id) {
                try {
                    await cloudinary.uploader.destroy(producto.imagen_id);
                } catch (error) {
                    console.warn("Error al eliminar imagen anterior:", error.message);
                }
            }

            producto.imagen = req.file.path;
            producto.imagen_id = req.file.filename;
        }

        await producto.save();

        return res.status(200).json({
            msg: "Producto personalizado actualizado exitosamente",
            producto: await producto.populate("ingredientes"),
        });

    } catch (error) {
        console.error("Error al actualizar producto personalizado:", error);
        return res.status(500).json({ msg: "Error al actualizar el producto", error: error.message });
    }
};

// Eliminar un producto personalizado
const deleteProductoPersonalizadoController = async (req, res) => {
  try {

    if (!req.clienteBDD) {
      return res.status(403).json({ msg: "Solo los clientes pueden eliminar productos personalizados." });
    }

    const cliente = req.clienteBDD;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de producto no válido" });
    }

    const producto = await ProductoPersonalizado.findById(id);

    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    if (!producto.cliente_id || producto.cliente_id.toString() !== cliente._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar este producto." });
    }

    if (producto.imagen_id) {
      try {
        await cloudinary.uploader.destroy(producto.imagen_id);
      } catch (error) {
        console.warn("Error al eliminar imagen de Cloudinary:", error.message);
      }
    }

    await producto.deleteOne();

    return res.status(200).json({ msg: "Producto personalizado eliminado correctamente" });

  } catch (error) {
    console.error("Error al eliminar producto personalizado:", error);
    return res.status(500).json({ msg: "Error al eliminar el producto", error: error.message });
  }
};

export {
    getAllProductosPersonalizadosController,
    getProductoPersonalizadoByIDController,
    createProductoPersonalizadoController,
    updateProductoPersonalizadoController,
    deleteProductoPersonalizadoController,
};
