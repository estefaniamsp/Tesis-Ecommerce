import Producto from "../models/productos.js";
import mongoose from "mongoose";

// Obtener todos los productos
const getAllProductosController = async (req, res) => {
  try {
    const productos = await Producto.find().populate('categoria');

    if (productos.length === 0) {
      return res.status(404).json({ msg: "No se encontraron productos" });
    }

    return res.status(200).json({ productos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al obtener los productos", error });
  }
};

// Obtener un producto por su ID
const getProductoByIDController = async (req, res) => {
  const { id } = req.params;

  // Verificar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de producto no válido" });
  }

  try {
    const producto = await Producto.findById(id).populate('categoria');

    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    return res.status(200).json({ producto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al obtener el producto", error });
  }
};

// Crear un nuevo producto
const createProductoController = async (req, res) => {
  const { nombre, descripcion, precio, cantidad, categoria, imagen } = req.body;

  // Verificar que todos los campos necesarios estén presentes
  if (!nombre || !descripcion || !precio || !cantidad || !categoria || !imagen) {
    return res.status(400).json({ msg: "Todos los campos son necesarios" });
  }

  // Verificar si el precio y la cantidad son válidos
  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ msg: "El precio debe ser un número positivo" });
  }

  if (isNaN(cantidad) || cantidad <= 0) {
    return res.status(400).json({ msg: "La cantidad debe ser un número positivo" });
  }

  try {
    // Verificar si el producto ya existe (basado en el nombre o algún otro criterio único)
    const productoExistente = await Producto.findOne({ nombre });
    if (productoExistente) {
      return res.status(400).json({ msg: "El producto con ese nombre ya existe" });
    }

    // Crear el nuevo producto
    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      cantidad,
      categoria,
      imagen,
    });

    // Guardar el producto en la base de datos
    await nuevoProducto.save();

    return res.status(201).json({ msg: "Producto creado exitosamente", producto: nuevoProducto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al crear el producto", error });
  }
};

// Actualizar un producto
const updateProductoController = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, cantidad, categoria, imagen } = req.body;

  // Verificar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de producto no válido" });
  }

  // Verificar si el producto existe
  const producto = await Producto.findById(id);
  if (!producto) {
    return res.status(404).json({ msg: "Producto no encontrado" });
  }

  // Verificar si los campos de precio y cantidad son válidos
  if (precio && (isNaN(precio) || precio <= 0)) {
    return res.status(400).json({ msg: "El precio debe ser un número positivo" });
  }

  if (cantidad && (isNaN(cantidad) || cantidad <= 0)) {
    return res.status(400).json({ msg: "La cantidad debe ser un número positivo" });
  }

  try {
    // Actualizar los valores del producto
    producto.nombre = nombre || producto.nombre;
    producto.descripcion = descripcion || producto.descripcion;
    producto.precio = precio || producto.precio;
    producto.cantidad = cantidad || producto.cantidad;
    producto.categoria = categoria || producto.categoria;
    producto.imagen = imagen || producto.imagen;

    // Guardar los cambios en la base de datos
    await producto.save();

    return res.status(200).json({ msg: "Producto actualizado exitosamente", producto });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al actualizar el producto", error });
  }
};

// Eliminar un producto
const deleteProductoController = async (req, res) => {
  const { id } = req.params;

  // Verificar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de producto no válido" });
  }

  try {
    // Buscar y eliminar el producto
    const productoEliminado = await Producto.findByIdAndDelete(id);
    if (!productoEliminado) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    return res.status(200).json({ msg: `Producto eliminado con éxito`, producto: productoEliminado });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al eliminar el producto", error });
  }
};

export {
  createProductoController,
  getAllProductosController,
  getProductoByIDController,
  updateProductoController,
  deleteProductoController,
};
