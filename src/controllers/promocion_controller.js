import Promocion from "../models/promociones.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// Obtener todas las promociones
const getAllPromocionesController = async (req, res) => {
    try {
        // Extraer y convertir los parámetros de consulta
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;

        // Validar que 'page' y 'limit' sean números enteros positivos
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        const skip = (page - 1) * limit;

        // Obtener las promociones con paginación
        const promociones = await Promocion.find()
            .skip(skip)
            .limit(limit);

        // Contar el total de promociones
        const totalPromociones = await Promocion.countDocuments();

        // Calcular el total de páginas
        const totalPaginas = Math.ceil(totalPromociones / limit);

        // Verificar si se encontraron promociones
        if (promociones.length === 0) {
            return res.status(404).json({ msg: "No se encontraron promociones" });
        }

        // Responder con las promociones y la información de paginación
        return res.status(200).json({
            totalPromociones,
            totalPaginas,
            paginaActual: page,
            promociones
        });
    } catch (error) {
        console.error("Error al obtener promociones:", error);
        return res.status(500).json({ msg: "Error al obtener las promociones", error: error.message });
    }
};

// Obtener una promoción por ID
const getPromocionByIdController = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID no válido" });
    }

    try {
        const promocion = await Promocion.findById(id);
        if (!promocion) {
            return res.status(404).json({ msg: "Promoción no encontrada" });
        }
        return res.status(200).json({ promocion });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error al obtener la promoción", error: error.message });
    }
};

// Crear una nueva promoción
const createPromocionController = async (req, res) => {
    const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;

    if (!nombre || !descripcion || !fecha_inicio || !fecha_fin || !req.file) {
        return res.status(400).json({ msg: "Todos los campos y la imagen son obligatorios" });
    }

    try {
        const promocionExistente = await Promocion.findOne({ nombre });
        if (promocionExistente) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({ msg: "La promoción ya existe. Imagen eliminada." });
        }

        const nuevaPromocion = new Promocion({
            nombre,
            descripcion,
            fecha_inicio,
            fecha_fin,
            imagen: req.file.path,
            imagen_id: req.file.filename,
        });

        await nuevaPromocion.save();

        return res.status(201).json({ msg: "Promoción creada exitosamente", promocion: nuevaPromocion });
    } catch (error) {
        console.error("Error al crear la promoción:", error);
        if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename);
        return res.status(500).json({ msg: "Error al crear la promoción", error: error.message });
    }
};

// Actualizar una promoción
const updatePromocionController = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, fecha_inicio, fecha_fin } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID no válido" });
    }

    try {
        const promocion = await Promocion.findById(id);
        if (!promocion) {
            return res.status(404).json({ msg: "Promoción no encontrada" });
        }

        if (req.file) {
            if (promocion.imagen_id) {
                try {
                    await cloudinary.uploader.destroy(promocion.imagen_id);
                } catch (error) {
                    console.warn("No se pudo eliminar la imagen en Cloudinary:", error.message);
                }
            }

            promocion.imagen = req.file.path;
            promocion.imagen_id = req.file.filename;
        }

        promocion.nombre = nombre || promocion.nombre;
        promocion.descripcion = descripcion || promocion.descripcion;
        promocion.fecha_inicio = fecha_inicio || promocion.fecha_inicio;
        promocion.fecha_fin = fecha_fin || promocion.fecha_fin;

        await promocion.save();

        return res.status(200).json({ msg: "Promoción actualizada exitosamente", promocion });
    } catch (error) {
        console.error("Error al actualizar la promoción:", error);
        return res.status(500).json({ msg: "Error al actualizar la promoción", error: error.message });
    }
};

// Eliminar una promoción
const deletePromocionController = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID no válido" });
    }

    try {
        const promocion = await Promocion.findById(id);
        if (!promocion) {
            return res.status(404).json({ msg: "Promoción no encontrada" });
        }

        // Manejo seguro de la eliminación de imagen en Cloudinary
        if (promocion.imagen_id) {
            try {
                await cloudinary.uploader.destroy(promocion.imagen_id);
            } catch (error) {
                console.warn("No se pudo eliminar la imagen en Cloudinary:", error.message);
            }
        }

        await promocion.deleteOne();

        return res.status(200).json({ msg: "Promoción eliminada exitosamente" });

    } catch (error) {
        console.error("Error al eliminar la promoción:", error);
        return res.status(500).json({ msg: "Error al eliminar la promoción", error: error.message });
    }
};

export {
    createPromocionController,
    getAllPromocionesController,
    getPromocionByIdController,
    updatePromocionController,
    deletePromocionController
};
