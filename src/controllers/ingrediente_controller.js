import Ingrediente from "../models/ingredientes.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// Obtener todos los ingredientes (sin categoría ahora)
const getAllIngredientesController = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;
        const id_categoria = req.query.id_categoria;

        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 10;

        const skip = (page - 1) * limit;

        const filtro = {};
        if (id_categoria && mongoose.Types.ObjectId.isValid(id_categoria)) {
            // Buscar ingredientes que contengan esta categoría en el array
            filtro.id_categoria = id_categoria;
        }

        const [ingredientes, total] = await Promise.all([
            Ingrediente.find(filtro).skip(skip).limit(limit),
            Ingrediente.countDocuments(filtro)
        ]);

        return res.status(200).json({
            ingredientes,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error al obtener ingredientes:", error);
        return res.status(500).json({ msg: "Error al obtener los ingredientes", error: error.message });
    }
};

// Obtener un ingrediente por su ID
const getIngredienteByIDController = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "ID de ingrediente no válido" });
    }
    try {
        const ingrediente = await Ingrediente.findById(id);
        if (!ingrediente) {
            return res.status(404).json({ msg: "Ingrediente no encontrado" });
        }
        return res.status(200).json({ ingrediente });
    } catch (error) {
        console.error("Error al obtener ingrediente:", error);
        return res.status(500).json({ msg: "Error al obtener el ingrediente", error: error.message });
    }
};

// Crear un nuevo ingrediente
const createIngredienteController = async (req, res) => {
    let { nombre, stock, precio, tipo, id_categoria } = req.body;

    if (!nombre || !stock || !precio || !tipo || !id_categoria || !req.file) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios: nombre, stock, precio, tipo, categoría e imagen." });
    }

    if (!Array.isArray(id_categoria)) {
        id_categoria = [id_categoria];
    }

    nombre = nombre.trim().toLowerCase();
    tipo = tipo.trim().toLowerCase();
    stock = parseInt(stock);
    precio = parseFloat(precio);

    if (isNaN(stock) || stock < 0 || stock > 100) {
        return res.status(400).json({ msg: "El stock debe ser un número entero entre 0 y 100 unidades." });
    }

    if (isNaN(precio) || precio < 1 || precio > 1000) {
        return res.status(400).json({ msg: "El precio debe estar entre $1 y $1000." });
    }

    try {
        const ingredienteExistente = await Ingrediente.findOne({ nombre: { $regex: new RegExp(`^${nombre}$`, "i") } });
        if (ingredienteExistente) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({ msg: "Ya existe un ingrediente con ese nombre. Imagen eliminada." });
        }

        const nuevoIngrediente = new Ingrediente({
            nombre,
            stock,
            precio,
            tipo,
            id_categoria,
            imagen: req.file.path,
            imagen_id: req.file.filename,
        });

        await nuevoIngrediente.save();
        return res.status(201).json({ msg: "Ingrediente creado exitosamente", ingrediente: nuevoIngrediente });
    } catch (error) {
        console.error("Error al crear ingrediente:", error);
        if (req.file?.filename) {
            try { await cloudinary.uploader.destroy(req.file.filename); } catch { }
        }
        return res.status(500).json({ msg: "Error al crear ingrediente", error: error.message });
    }
};

// Actualizar un ingrediente
const updateIngredienteController = async (req, res) => {
    const { id } = req.params;
    let { nombre, stock, precio, tipo, id_categoria } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID no válido" });
    }

    try {
        const ingrediente = await Ingrediente.findById(id);
        if (!ingrediente) {
            return res.status(404).json({ msg: "Ingrediente no encontrado" });
        }

        // Actualizar imagen si se envía nueva
        if (req.file) {
            if (ingrediente.imagen_id) {
                try { await cloudinary.uploader.destroy(ingrediente.imagen_id); } catch { }
            }
            ingrediente.imagen = req.file.path;
            ingrediente.imagen_id = req.file.filename;
        }

        // Actualizar nombre
        if (nombre !== undefined) {
            nombre = nombre.trim().toLowerCase();
            const duplicado = await Ingrediente.findOne({
                _id: { $ne: id },
                nombre: { $regex: new RegExp(`^${nombre}$`, "i") },
            });
            if (duplicado) return res.status(400).json({ msg: "Ya existe otro ingrediente con ese nombre." });
            ingrediente.nombre = nombre;
        }

        // Actualizar tipo
        if (tipo !== undefined) {
            ingrediente.tipo = tipo.trim().toLowerCase();
        }

        // Actualizar stock
        if (stock !== undefined) {
            const s = parseInt(stock);
            if (isNaN(s) || s < 0 || s > 100) {
                return res.status(400).json({ msg: "El stock debe ser un número entre 0 y 100." });
            }
            ingrediente.stock = s;
        }

        // Actualizar precio
        if (precio !== undefined) {
            const p = parseFloat(precio);
            if (isNaN(p) || p < 1 || p > 1000) {
                return res.status(400).json({ msg: "El precio debe estar entre $1 y $1000." });
            }
            ingrediente.precio = p;
        }

        // Actualizar categorías
        if (id_categoria !== undefined) {
            if (!Array.isArray(id_categoria)) {
                id_categoria = [id_categoria];
            }
            ingrediente.id_categoria = id_categoria;
        }

        await ingrediente.save();
        return res.status(200).json({ msg: "Ingrediente actualizado exitosamente", ingrediente });
    } catch (error) {
        console.error("Error al actualizar ingrediente:", error);
        return res.status(500).json({ msg: "Error al actualizar ingrediente", error: error.message });
    }
};

// Eliminar un ingrediente
const deleteIngredienteController = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: "ID de ingrediente no válido" });
    try {
        const ingrediente = await Ingrediente.findById(id);
        if (!ingrediente) return res.status(404).json({ msg: "Ingrediente no encontrado" });

        if (ingrediente.imagen_id) {
            try { await cloudinary.uploader.destroy(ingrediente.imagen_id); } catch { }
        }

        await ingrediente.deleteOne();
        return res.status(200).json({ msg: "Ingrediente eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar ingrediente:", error);
        return res.status(500).json({ msg: "Error al eliminar ingrediente", error: error.message });
    }
};

export {
    getAllIngredientesController,
    getIngredienteByIDController,
    createIngredienteController,
    updateIngredienteController,
    deleteIngredienteController,
};
