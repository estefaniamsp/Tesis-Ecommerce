import Ingrediente from "../models/ingredientes.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// Obtener todos los ingredientes
const getAllIngredientesController = async (req, res) => {
    try {
        // Extraer y convertir los parámetros de consulta
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;

        // Validar que 'page' y 'limit' sean números enteros positivos
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        const skip = (page - 1) * limit;
        const ingredientes = await Ingrediente.find().populate("id_categoria")
            .skip(skip)
            .limit(limit);

        if (ingredientes.length === 0) {
            return res.status(404).json({ msg: "No se encontraron ingredientes" });
        }

        return res.status(200).json({ ingredientes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error al obtener los ingredientes", error });
    }
};

// Obtener un ingrediente por su ID
const getIngredienteByIDController = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ msg: "Ingrediente no encontrado" });
        }

        // Buscar el ingrediente por su ID
        const ingrediente = await Ingrediente.findById(id).populate("id_categoria");

        if (!ingrediente) {
            return res.status(404).json({ msg: "Ingrediente no encontrado" });
        }

        return res.status(200).json({ ingrediente });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error al obtener el ingrediente", error });
    }
};

// Crear un nuevo ingrediente
const createIngredienteController = async (req, res) => {
    let { nombre, stock, id_categoria, precio } = req.body;

    if (!nombre || !stock || !id_categoria || !precio || !req.file) {
        return res.status(400).json({
            msg: "El nombre, el stock, la categoría, el precio y la imagen son obligatorios"
        });
    }

    nombre = nombre.trim();
    stock = parseInt(stock.trim());
    precio = parseFloat(precio.trim());

    try {
        // Verificar si ya existe un ingrediente con ese nombre
        const ingredienteExistente = await Ingrediente.findOne({ nombre });
        if (ingredienteExistente) {
            // Eliminar la imagen recién subida por multer-storage-cloudinary
            await cloudinary.uploader.destroy(req.file.filename); // filename = public_id
            return res.status(400).json({
                msg: "El ingrediente ya existe. La imagen subida fue eliminada automáticamente."
            });
        }

        // Crear el nuevo ingrediente con los datos de la imagen ya subida por multer
        const nuevoIngrediente = new Ingrediente({
            nombre,
            stock,
            id_categoria,
            precio,
            imagen: req.file.path, // ya es secure_url
            imagen_id: req.file.filename, // es el public_id
        });

        await nuevoIngrediente.save();

        return res.status(201).json({
            msg: "Ingrediente creado exitosamente",
            ingrediente: nuevoIngrediente
        });

    } catch (error) {
        console.error(error);

        // Eliminar la imagen si ocurrió un error
        if (req.file?.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
            } catch (e) {
                console.warn("No se pudo eliminar la imagen tras fallo:", e.message);
            }
        }

        return res.status(500).json({
            msg: "Ocurrió un error interno. La imagen fue eliminada si se alcanzó a subir.",
            error: error.message,
        });
    }
};

// Actualizar un ingrediente existente
const updateIngredienteController = async (req, res) => {
    const { id } = req.params;
    const { nombre, stock, id_categoria, precio } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID no válido" });
    }

    try {
        const ingrediente = await Ingrediente.findById(id);
        if (!ingrediente) {
            return res.status(404).json({ msg: "Ingrediente no encontrado" });
        }

        // Si llega nueva imagen, reemplazar usando la imagen que Multer ya subió
        if (req.file) {
            // Eliminar imagen anterior de Cloudinary si existe
            if (ingrediente.imagen_id) {
                try {
                    await cloudinary.uploader.destroy(ingrediente.imagen_id);
                } catch (error) {
                    console.warn("Error al eliminar imagen anterior:", error.message);
                }
            }

            // Asignar nueva imagen (ya subida por Multer)
            ingrediente.imagen = req.file.path; // secure_url
            ingrediente.imagen_id = req.file.filename; // public_id
        }

        // Actualizar nombre, stock, categoria y precio si vienen
        if (nombre) ingrediente.nombre = nombre.trim();
        if (stock) ingrediente.stock = parseInt(stock.trim());
        if (id_categoria) ingrediente.id_categoria = id_categoria.trim();
        if (precio) ingrediente.precio = parseFloat(precio.trim());

        await ingrediente.save();

        return res.status(200).json({
            msg: "Ingrediente actualizado exitosamente",
            ingrediente
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            msg: "Error al actualizar el ingrediente",
            error: error.message
        });
    }
};

// Eliminar un ingrediente
const deleteIngredienteController = async (req, res) => {
    const { id } = req.params;

    try {
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
        await Ingrediente.findByIdAndDelete(id);

        return res.status(200).json({ msg: "Ingrediente eliminado exitosamente" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error al eliminar el ingrediente", error });
    }
};

export {
    getAllIngredientesController,
    getIngredienteByIDController,
    createIngredienteController,
    updateIngredienteController,
    deleteIngredienteController,
};
