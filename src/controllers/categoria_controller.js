import Categoria from "../models/categorias.js";
import mongoose from "mongoose";
import cloudinary from '../config/cloudinary.js';

// Obtener todas las categorías
const getAllCategoriasController = async (req, res) => {
  try {
    const categorias = await Categoria.find(); // Obtener todas las categorías

    if (categorias.length === 0) {
      return res.status(404).json({ msg: "No se encontraron categorías" });
    }

    return res.status(200).json({ categorias });
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    return res.status(500).json({ msg: "Error al obtener las categorías", error: error.message });
  }
};

// Obtener una categoría por su ID
const getCategoriaByIDController = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de categoría no válida" });
    }

    // Buscar la categoría por su ID
    const categoria = await Categoria.findById(id);

    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    return res.status(200).json({ categoria });
  } catch (error) {
    console.error("Error al obtener la categoría:", error);
    return res.status(500).json({ msg: "Error al obtener la categoría", error: error.message });
  }
};

// Crear una nueva categoría
const createCategoriaController = async (req, res) => {
  let { nombre, descripcion } = req.body;

  if (!nombre || !descripcion || !req.file) {
    return res.status(400).json({ msg: "El nombre, la descripción y la imagen son obligatorios" });
  }

  nombre = nombre.trim();
  descripcion = descripcion.trim();

  try {
    const categoriaExistente = await Categoria.findOne({ nombre });
    if (categoriaExistente) {
      // Eliminar la imagen que ya subió Multer a Cloudinary
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({
        msg: "La categoría ya existe. La imagen subida fue eliminada automáticamente."
      });
    }

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      imagen: req.file.path, // Ya subido por Multer
      imagen_id: req.file.filename,
    });

    await nuevaCategoria.save();

    return res.status(201).json({
      msg: "Categoría creada exitosamente",
      categoria: nuevaCategoria
    });

  } catch (error) {
    console.error("Error al crear la categoría:", error);
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cloudError) {
        console.warn("Error al eliminar la imagen después del fallo:", cloudError.message);
      }
    }
    return res.status(500).json({
      msg: "Ocurrió un error interno. La imagen subida fue eliminada.",
      error: error.message,
    });
  }
};

// Actualizar una categoría existente
const updateCategoriaController = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID no válido" });
  }

  try {
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    // Si llega nueva imagen, reemplazar usando la imagen que Multer ya subió
    if (req.file) {
      // Eliminar imagen anterior de Cloudinary si existe
      if (categoria.imagen_id) {
        try {
          await cloudinary.uploader.destroy(categoria.imagen_id);
        } catch (error) {
          console.warn("Error al eliminar imagen anterior:", error.message);
        }
      }

      // Asignar nueva imagen (ya subida por Multer)
      categoria.imagen = req.file.path;
      categoria.imagen_id = req.file.filename;
    }

    // Actualizar nombre y descripción si vienen
    categoria.nombre = nombre ? nombre.trim() : categoria.nombre;
    categoria.descripcion = descripcion ? descripcion.trim() : categoria.descripcion;

    await categoria.save();

    return res.status(200).json({ msg: "Categoría actualizada exitosamente", categoria });

  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    return res.status(500).json({ msg: "Error al actualizar la categoría", error: error.message });
  }
};

// Eliminar una categoría
const deleteCategoriaController = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Verificar si la categoría existe
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    // 2. Eliminar la imagen de Cloudinary (si tiene imagen_id)
    if (categoria.imagen_id) {
      try {
        await cloudinary.uploader.destroy(categoria.imagen_id);
      } catch (error) {
        console.warn("No se pudo eliminar la imagen en Cloudinary:", error.message);
      }
    }

    // 3. Eliminar la categoría de la base de datos
    await Categoria.findByIdAndDelete(id);

    return res.status(200).json({ msg: "Categoría eliminada exitosamente" });

  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    return res.status(500).json({ msg: "Error al eliminar la categoría", error: error.message });
  }
};

export {
  getAllCategoriasController,
  getCategoriaByIDController,
  createCategoriaController,
  updateCategoriaController,
  deleteCategoriaController,
};
