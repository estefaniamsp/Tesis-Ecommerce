import ProductoPersonalizado from "../models/productosPersonalizados.js";
import Ingrediente from "../models/ingredientes.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { recomendarProductoConHF } from "../services/huggingFaceIA.js";

// Obtener todos los productos personalizados del usuario autenticado
const getAllProductosPersonalizadosController = async (req, res) => {
    try {
        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Acceso denegado: solo los clientes pueden ver sus productos personalizados." });
        }

        const clienteId = req.clienteBDD._id;

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

        return res.status(200).json({ totalProductos, totalPaginas, paginaActual: page, productos });
    } catch (error) {
        console.error("Error al obtener los productos personalizados:", error);
        return res.status(500).json({ msg: "Error al obtener los productos personalizados", error: error.message });
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

        if (!producto || producto.cliente_id.toString() !== usuario) {
            return res.status(404).json({ msg: "Producto no encontrado o no autorizado" });
        }

        return res.status(200).json({ producto });
    } catch (error) {
        console.error("Error al obtener producto personalizado:", error.message);
        return res.status(500).json({ msg: "Error al obtener el producto", error: error.message });
    }
};

// Crear un nuevo producto personalizado
const createProductoPersonalizadoController = async (req, res) => {
    try {
        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Solo los clientes pueden crear productos personalizados." });
        }

        let { ingredientes, id_categoria } = req.body;

        if (!ingredientes || !id_categoria) {
            return res.status(400).json({
                msg: "Los campos obligatorios son: ingredientes y categoría.",
                camposRecibidos: req.body,
            });
        }

        if (typeof ingredientes === "string") ingredientes = [ingredientes];
        if (!Array.isArray(ingredientes) || ingredientes.length < 5) {
            return res.status(400).json({
                msg: "Debe haber al menos 5 ingredientes: molde, color, 2 esencias y 1 aroma."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id_categoria)) {
            return res.status(400).json({ msg: "ID de categoría no válido." });
        }

        const ingredientesEnBD = await Ingrediente.find({ _id: { $in: ingredientes } });

        if (ingredientesEnBD.length !== ingredientes.length) {
            return res.status(400).json({ msg: "Uno o más ingredientes no existen." });
        }

        const ingredientesInvalidos = ingredientesEnBD.filter(ing =>
            !ing.id_categoria.map(id => id.toString()).includes(id_categoria)
        );

        if (ingredientesInvalidos.length > 0) {
            return res.status(400).json({
                msg: "Uno o más ingredientes no corresponden a la categoría seleccionada.",
                ingredientesInvalidos: ingredientesInvalidos.map(i => i.nombre),
            });
        }

        let molde = null;
        let color = null;
        let aroma = null;
        const esencias = [];
        const idsUnicos = new Set();

        for (const ing of ingredientesEnBD) {
            const tipo = ing.tipo.toLowerCase();

            if (idsUnicos.has(ing._id.toString())) {
                return res.status(400).json({ msg: `Ingrediente duplicado: ${ing.nombre}` });
            }
            idsUnicos.add(ing._id.toString());

            const data = { _id: ing._id, nombre: ing.nombre, imagen: ing.imagen };

            if (tipo === "molde") {
                if (molde) return res.status(400).json({ msg: "Solo se permite un molde." });
                molde = data;
            } else if (["color", "colorante"].includes(tipo)) {
                if (color) return res.status(400).json({ msg: "Solo se permite un color." });
                color = data;
            } else if (["esencia", "escencia", "fragancia"].includes(tipo)) {
                esencias.push(data);
            } else if (tipo === "aroma") {
                if (aroma) return res.status(400).json({ msg: "Solo se permite un aroma." });
                aroma = data;
            }
        }

        const errores = [];
        if (!molde) errores.push("Debe haber exactamente 1 molde.");
        if (!color) errores.push("Debe haber exactamente 1 color.");
        if (!aroma) errores.push("Debe haber exactamente 1 aroma.");
        if (esencias.length < 2) errores.push("Faltan esencias, se requieren 2.");
        if (esencias.length > 2) errores.push("Hay demasiadas esencias, solo se permiten 2.");

        if (errores.length > 0) {
            return res.status(400).json({ msg: "Validación de ingredientes fallida.", errores });
        }

        const productoExistente = await ProductoPersonalizado.findOne({
            cliente_id: req.clienteBDD._id,
            id_categoria,
            ingredientes: { $all: ingredientes, $size: ingredientes.length }
        });

        if (productoExistente) {
            return res.status(409).json({
                msg: "Ya tienes un producto personalizado con estos mismos ingredientes."
            });
        }

        const precio = ingredientesEnBD.reduce((acc, ing) => acc + ing.precio, 0);

        const nuevoProducto = new ProductoPersonalizado({
            cliente_id: req.clienteBDD._id,
            ingredientes,
            id_categoria,
            precio,
            aroma: aroma.nombre,
        });

        await nuevoProducto.save();
        await nuevoProducto.populate("id_categoria", "nombre");

        return res.status(201).json({
            msg: "Producto personalizado creado exitosamente",
            producto_personalizado: {
                _id: nuevoProducto._id,
                categoria: nuevoProducto.id_categoria?.nombre?.toLowerCase() || "desconocida",
                aroma: aroma.nombre,
                molde,
                color,
                esencias,
            },
        });
    } catch (error) {
        console.error("Error al crear el producto personalizado:", error);
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID de producto no válido" });
        }

        const producto = await ProductoPersonalizado.findById(id);
        if (!producto) {
            return res.status(404).json({ msg: "Producto personalizado no encontrado" });
        }
        if (producto.cliente_id.toString() !== req.clienteBDD._id.toString()) {
            return res.status(403).json({ msg: "No tienes permiso para modificar este producto." });
        }

        if (typeof ingredientes === "string") ingredientes = [ingredientes];
        if (!Array.isArray(ingredientes) || ingredientes.length < 5) {
            return res.status(400).json({ msg: "Debes enviar al menos 5 ingredientes: molde, color, aroma y 2 esencias." });
        }

        const duplicado = await ProductoPersonalizado.findOne({
            _id: { $ne: id },
            cliente_id: req.clienteBDD._id,
            id_categoria: producto.id_categoria,
            aroma: producto.aroma,
            ingredientes: { $all: ingredientes, $size: ingredientes.length },
        });
        if (duplicado) {
            return res.status(409).json({ msg: "Ya tienes otro producto con esta misma combinación." });
        }

        const ingredientesDB = await Ingrediente.find({ _id: { $in: ingredientes } });

        if (ingredientesDB.length !== ingredientes.length) {
            return res.status(400).json({ msg: "Uno o más ingredientes no existen." });
        }

        const ingredientesInvalidos = ingredientesDB.filter(ing =>
            !ing.id_categoria.map(id => id.toString()).includes(producto.id_categoria.toString())
        );

        if (ingredientesInvalidos.length > 0) {
            return res.status(400).json({
                msg: "Uno o más ingredientes no corresponden a la categoría del producto.",
                ingredientesInvalidos: ingredientesInvalidos.map(i => i.nombre),
            });
        }

        let molde = null;
        let color = null;
        let aroma = null;
        const esencias = [];
        const idsUnicos = new Set();

        for (const ing of ingredientesDB) {
            if (idsUnicos.has(ing._id.toString())) {
                return res.status(400).json({ msg: `Ingrediente duplicado: ${ing.nombre}` });
            }
            idsUnicos.add(ing._id.toString());

            const info = { _id: ing._id, nombre: ing.nombre, imagen: ing.imagen };
            const tipo = ing.tipo.toLowerCase();

            if (tipo === "molde") {
                if (molde) return res.status(400).json({ msg: "Solo se permite un molde." });
                molde = info;
            } else if (["color", "colorante"].includes(tipo)) {
                if (color) return res.status(400).json({ msg: "Solo se permite un color." });
                color = info;
            } else if (["esencia", "escencia", "fragancia"].includes(tipo)) {
                esencias.push(info);
            } else if (tipo === "aroma") {
                if (aroma) return res.status(400).json({ msg: "Solo se permite un aroma." });
                aroma = info;
            }
        }

        if (!molde || !color || !aroma || esencias.length !== 2) {
            return res.status(400).json({ msg: "Debe haber 1 molde, 1 color, 1 aroma y exactamente 2 esencias." });
        }

        producto.ingredientes = ingredientes;
        producto.precio = ingredientesDB.reduce((acc, ing) => acc + ing.precio, 0);
        producto.aroma = aroma.nombre;
        await producto.save();

        const categoria = await mongoose.model("Categorias").findById(producto.id_categoria);

        return res.status(200).json({
            msg: "Producto personalizado actualizado exitosamente",
            producto_personalizado: {
                _id: producto._id,
                categoría: categoria?.nombre || "Sin categoría",
                aroma: producto.aroma,
                molde,
                color,
                esencias,
            },
        });
    } catch (error) {
        console.error("Error al actualizar producto personalizado:", error);
        return res.status(500).json({ msg: "Error al actualizar el producto", error: error.message });
    }
};

// actualizar imagen de un producto personalizado
const updateImagenProductoPersonalizadoController = async (req, res) => {
    const { id } = req.params;

    if (!req.clienteBDD) {
        return res.status(403).json({ msg: "Acceso denegado." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID de producto no válido" });
    }

    if (!req.file) {
        return res.status(400).json({ msg: "La imagen es obligatoria" });
    }

    try {
        const producto = await ProductoPersonalizado.findById(id);

        if (!producto) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(404).json({ msg: "Producto no encontrado" });
        }

        if (producto.cliente_id.toString() !== req.clienteBDD._id.toString()) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(403).json({ msg: "No tienes permiso para modificar este producto." });
        }

        // Eliminar imagen anterior si existe
        if (producto.imagen_id) {
            try {
                await cloudinary.uploader.destroy(producto.imagen_id);
            } catch (err) {
                console.warn("Error al eliminar imagen previa:", err.message);
            }
        }

        // Asignar nueva imagen
        producto.imagen = req.file.path;
        producto.imagen_id = req.file.filename;
        await producto.save();

        return res.status(200).json({
            msg: "Imagen del producto personalizada actualizada",
            imagen: producto.imagen
        });

    } catch (error) {
        console.error("Error al actualizar imagen:", error);
        await cloudinary.uploader.destroy(req.file.filename);
        return res.status(500).json({ msg: "Error al actualizar la imagen", error: error.message });
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

        // Eliminar imagen de Cloudinary si existe
        if (producto.imagen_id) {
            try {
                await cloudinary.uploader.destroy(producto.imagen_id);
            } catch (error) {
                console.warn("Error al eliminar imagen de Cloudinary:", error.message);
            }
        }

        // Eliminar el producto personalizado
        await producto.deleteOne();

        // Eliminar referencias en carritos
        await Carrito.updateMany(
            { "productos.producto_id": producto._id },
            { $pull: { productos: { producto_id: producto._id } } }
        );

        return res.status(200).json({ msg: "Producto personalizado eliminado correctamente y eliminado de los carritos." });

    } catch (error) {
        console.error("Error al eliminar producto personalizado:", error);
        return res.status(500).json({ msg: "Error al eliminar el producto", error: error.message });
    }
};

const personalizarProductoIAController = async (req, res) => {
    try {
        if (!req.clienteBDD) {
            return res.status(403).json({ msg: "Solo los clientes pueden personalizar productos con IA." });
        }

        const { id_categoria } = req.body;

        if (!id_categoria) {
            return res.status(400).json({ msg: "La categoría es obligatoria." });
        }

        const recomendacion = await recomendarProductoConHF(req.clienteBDD._id, id_categoria);

        const productoIA = recomendacion?.producto_personalizado;
        if (!productoIA) {
            return res.status(400).json({ msg: "La IA no devolvió un producto válido.", raw: recomendacion });
        }

        // Devuelve la recomendación sin guardar en la base de datos
        return res.status(200).json({
            msg: "Producto recomendado por IA generado exitosamente.",
            producto_personalizado: {
                ...productoIA,
                origen: "ia"
            }
        });

    } catch (error) {
        console.error("Error al personalizar producto con IA:", error.message || error);
        return res.status(500).json({ msg: "Error al personalizar producto con IA", error: error.message });
    }
};

export {
    getAllProductosPersonalizadosController,
    getProductoPersonalizadoByIDController,
    createProductoPersonalizadoController,
    updateProductoPersonalizadoController,
    updateImagenProductoPersonalizadoController,
    deleteProductoPersonalizadoController,
    personalizarProductoIAController
};
