import Ingrediente from "../models/ingredientes.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// Obtener todos los ingredientes
const getAllIngredientesController = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;
        const { id_categoria } = req.query;

        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 10;

        const skip = (page - 1) * limit;

        const filtro = {};
        if (id_categoria) {
            if (!mongoose.Types.ObjectId.isValid(id_categoria)) {
                return res.status(400).json({ msg: "ID de categoría no válido" });
            }
            filtro.id_categoria = id_categoria;
        }

        const [ingredientes, total] = await Promise.all([
            Ingrediente.find(filtro)
                .populate("id_categoria")
                .skip(skip)
                .limit(limit),
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

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "ID de ingrediente no válido" });
    }

    try {

        const ingrediente = await Ingrediente.findById(id).populate("id_categoria");

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
    let { nombre, stock, id_categoria, precio, tipo } = req.body;

    if (!nombre || !stock || !id_categoria || !precio || tipo || !req.file) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    nombre = nombre.trim();
    stock = parseInt(stock.trim());
    precio = parseFloat(precio.trim());
    tipo = tipo.trim();

    if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ msg: "El stock debe ser un número entero mayor o igual a 0" });
    }

    if (isNaN(precio) || precio < 0) {
        return res.status(400).json({ msg: "El precio debe ser un número decimal mayor o igual a 0" });
    }

    if (!mongoose.Types.ObjectId.isValid(id_categoria)) {
        return res.status(400).json({ msg: "El ID de la categoría no es válido" });
    }

    try {
        // Verificar si ya existe un ingrediente con ese nombre
        const ingredienteExistente = await Ingrediente.findOne({ nombre });
        if (ingredienteExistente) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({
                msg: "El ingrediente ya existe. La imagen subida fue eliminada automáticamente."
            });
        }

        const nuevoIngrediente = new Ingrediente({
            nombre,
            stock,
            id_categoria,
            precio,
            tipo,
            imagen: req.file.path,
            imagen_id: req.file.filename,
        });

        await nuevoIngrediente.save();

        return res.status(201).json({ msg: "Ingrediente creado exitosamente", ingrediente: nuevoIngrediente });

    } catch (error) {
        console.error("Error al crear ingrediente:", error);

        if (req.file?.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (e) {
                console.warn("No se pudo eliminar la imagen tras fallo:", e.message);
            }
        }

        return res.status(500).json({ msg: "Ocurrió un error interno. La imagen fue eliminada si se alcanzó a subir.", error: error.message, });
    }
};

// Actualizar un ingrediente existente
const updateIngredienteController = async (req, res) => {
    const { id } = req.params;
    const { nombre, stock, id_categoria, precio, tipo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID no válido" });
    }

    try {
        const ingrediente = await Ingrediente.findById(id);
        if (!ingrediente) {
            return res.status(404).json({ msg: "Ingrediente no encontrado" });
        }

        if (req.file) {
            // Eliminar imagen anterior de Cloudinary si existe
            if (ingrediente.imagen_id) {
                try {
                    await cloudinary.uploader.destroy(ingrediente.imagen_id);
                } catch (error) {
                    console.warn("Error al eliminar imagen anterior:", error.message);
                }
            }

            ingrediente.imagen = req.file.path;
            ingrediente.imagen_id = req.file.filename;
        }

        // Actualizar nombre, stock, categoria y precio si vienen
        if (nombre !== undefined) ingrediente.nombre = nombre.trim();
        if (tipo !== undefined) ingrediente.tipo = tipo.trim();
        if (stock !== undefined) {
            const parsedStock = parseInt(stock);
            if (isNaN(parsedStock) || parsedStock < 0) {
                return res.status(400).json({ msg: "El stock debe ser un número entero válido mayor o igual a 0" });
            }
            ingrediente.stock = parseInt(stock.trim());
        }

        if (precio !== undefined) {
            const parsedPrecio = parseFloat(precio);
            if (isNaN(parsedPrecio) || parsedPrecio < 0) {
                return res.status(400).json({ msg: "El precio debe ser un número decimal válido mayor o igual a 0" });
            }
            ingrediente.precio = parsedPrecio;
        }

        if (id_categoria !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(id_categoria)) {
                return res.status(400).json({ msg: "ID de categoría no válido" });
            }
            ingrediente.id_categoria = id_categoria.trim();
        }

        await ingrediente.save();

        return res.status(200).json({ msg: "Ingrediente actualizado exitosamente", ingrediente });

    } catch (error) {
        console.error("Error al actualizar ingrediente:", error);
        return res.status(500).json({ msg: "Error al actualizar el ingrediente", error: error.message });
    }
};

// Eliminar un ingrediente
const deleteIngredienteController = async (req, res) => {
    const { id } = req.params;

    try {

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: "ID de ingrediente no válido" });
        }

        // Verificar si el ingrediente existe
        const ingrediente = await Ingrediente.findById(id);
        if (!ingrediente) {
            return res.status(404).json({ msg: "Ingrediente no encontrado" });
        }

        // Eliminar la imagen de Cloudinary (si tiene imagen_id)
        if (ingrediente.imagen_id) {
            try {
                await cloudinary.uploader.destroy(ingrediente.imagen_id);
            } catch (error) {
                console.warn("No se pudo eliminar la imagen en Cloudinary:", error.message);
            }
        }

        // Eliminar el ingrediente de la base de datos
        await Ingrediente.deleteOne();

        return res.status(200).json({ msg: "Ingrediente eliminado exitosamente" });

    } catch (error) {
        console.error("Error al eliminar ingrediente:", error);
        return res.status(500).json({ msg: "Error al eliminar el ingrediente", error: error.message });
    }
};

export {
    getAllIngredientesController,
    getIngredienteByIDController,
    createIngredienteController,
    updateIngredienteController,
    deleteIngredienteController,
};
