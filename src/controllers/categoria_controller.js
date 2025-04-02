import Categoria from "../models/categorias.js";
import mongoose from "mongoose";
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
  const { nombre, descripcion, imagen } = req.body;

  // Validar que todos los campos necesarios estén presentes
  if (!nombre || !descripcion) {
    return res.status(400).json({ msg: "El nombre y la descripción son necesarios" });
  }

  try {
    // Verificar si la categoría ya existe
    const categoriaExistente = await Categoria.findOne({ nombre });
    if (categoriaExistente) {
      return res.status(400).json({ msg: "La categoría ya existe" });
    }

    // Crear y guardar la nueva categoría
    const nuevaCategoria = new Categoria({ nombre, descripcion, imagen });
    await nuevaCategoria.save();

    return res.status(201).json({ msg: "Categoría creada exitosamente", categoria: nuevaCategoria });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al crear la categoría", error });
  }
};

// Actualizar una categoría existente
const updateCategoriaController = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen } = req.body;

  // Verificar si la categoría existe
  const categoria = await Categoria.findById(id);
  if (!categoria) {
    return res.status(404).json({ msg: "Categoría no encontrada" });
  }

  // Actualizar la categoría con los nuevos valores
  categoria.nombre = nombre || categoria.nombre;
  categoria.descripcion = descripcion || categoria.descripcion;
  categoria.imagen = imagen || categoria.imagen;

  try {
    await categoria.save();
    return res.status(200).json({ msg: "Categoría actualizada exitosamente", categoria });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al actualizar la categoría", error });
  }
};

// Eliminar una categoría
const deleteCategoriaController = async (req, res) => {
  const { id } = req.params;

  // Verificar si la categoría existe
  const categoria = await Categoria.findById(id);
  if (!categoria) {
    return res.status(404).json({ msg: "Categoría no encontrada" });
  }

  try {
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
