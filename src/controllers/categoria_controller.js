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
    console.error(error);
    return res.status(500).json({ msg: "Error al obtener las categorías", error });
  }
};

// Obtener una categoría por su ID
const getCategoriaByIDController = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    // Buscar la categoría por su ID
    const categoria = await Categoria.findById(id);

    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    return res.status(200).json({ categoria });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al obtener la categoría", error });
  }
};

// Crear una nueva categoría
const createCategoriaController = async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion || !req.file) {
    return res.status(400).json({ msg: "El nombre, la descripción y la imagen son obligatorios" });
  }

  try {
    const categoriaExistente = await Categoria.findOne({ nombre });
    if (categoriaExistente) {
      // Eliminar la imagen subida si el nombre ya existe
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({
        msg: "La categoría ya existe. La imagen subida fue eliminada automáticamente."
      });
    }

    // Subir imagen a carpeta "categorias" en Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "categorias"
    });

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      imagen: result.secure_url,
      imagen_id: result.public_id,
    });

    await nuevaCategoria.save();

    return res.status(201).json({
      msg: "Categoría creada exitosamente",
      categoria: nuevaCategoria
    });

  } catch (error) {
    console.error(error);
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
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

    // Si llega nueva imagen, reemplazar
    if (req.file) {
      if (categoria.imagen_id) {
        await cloudinary.uploader.destroy(categoria.imagen_id);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categorias"
      });

      categoria.imagen = result.secure_url;
      categoria.imagen_id = result.public_id;
    }

    // Actualizar nombre y descripción si vienen
    categoria.nombre = nombre || categoria.nombre;
    categoria.descripcion = descripcion || categoria.descripcion;

    await categoria.save();

    return res.status(200).json({ msg: "Categoría actualizada exitosamente", categoria });

  } catch (error) {
    console.error(error);
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
      await cloudinary.uploader.destroy(categoria.imagen_id);
    }

    // 3. Eliminar la categoría de la base de datos
    await Categoria.findByIdAndDelete(id);

    return res.status(200).json({ msg: "Categoría eliminada exitosamente" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al eliminar la categoría", error });
  }
};

export {
  getAllCategoriasController,
  getCategoriaByIDController,
  createCategoriaController,
  updateCategoriaController,
  deleteCategoriaController,
};
