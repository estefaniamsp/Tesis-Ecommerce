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
  let { nombre, descripcion } = req.body;

  if (!nombre || !descripcion || !req.file) {
    return res.status(400).json({ msg: "El nombre, la descripción y la imagen son obligatorios" });
  }

  // Limpiar espacios
  nombre = nombre.trim();
  descripcion = descripcion.trim();

  try {
    // Buscar si ya existe la categoría por nombre
    const categoriaExistente = await Categoria.findOne({ nombre });
    if (categoriaExistente) {
      // Si existe, eliminar la imagen que multer subió
      if (req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({
        msg: "La categoría ya existe. La imagen subida fue eliminada automáticamente."
      });
    }

    // Crear nueva categoría usando los datos que multer ya subió
    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      imagen: req.file.path,     // URL segura de la imagen
      imagen_id: req.file.filename, // ID público de Cloudinary
    });

    await nuevaCategoria.save();

    return res.status(201).json({
      msg: "Categoría creada exitosamente",
      categoria: nuevaCategoria,
    });

  } catch (error) {
    console.error(error);
    // Si ocurre error, eliminar imagen subida
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
  let { nombre, descripcion } = req.body;

  // Validar ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de categoría no válido" });
  }

  try {
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    // Limpiar espacios si se envían
    if (nombre) {
      nombre = nombre.trim();
    }
    if (descripcion) {
      descripcion = descripcion.trim();
    }

    // Si se envió nueva imagen, eliminar la anterior de Cloudinary y usar la nueva
    if (req.file) {
      if (categoria.imagen_id) {
        await cloudinary.uploader.destroy(categoria.imagen_id);
      }

      categoria.imagen = req.file.path;      // Nueva URL
      categoria.imagen_id = req.file.filename; // Nuevo ID de imagen
    }

    // Actualizar campos
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
