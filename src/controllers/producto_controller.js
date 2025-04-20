import Producto from "../models/productos.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// Obtener todos los productos
const getAllProductosController = async (req, res) => {
  try {
    const productos = await Producto.find().populate('id_categoria');

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
    const producto = await Producto.findById(id).populate('id_categoria');

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
  const { nombre, descripcion, precio, id_categoria, stock } = req.body;
  let beneficios = req.body.beneficios;

  // Validaciones básicas
  if (!nombre || !descripcion || !beneficios || !precio || !stock || !id_categoria) {
    console.log(req.body);
    return res.status(400).json({ msg: "Todos los campos son necesarios" });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ msg: "El precio debe ser un número positivo" });
  }

  if (!beneficios) {
    beneficios = [];
  } else if (typeof beneficios === "string") {
    beneficios = [beneficios];
  }

  // Verifica si llegó un archivo (imagen)
  if (!req.file) {
    return res.status(400).json({ msg: "La imagen del producto es obligatoria" });
  }

  try {
    // Verifica si ya existe un producto con ese nombre
    const productoExistente = await Producto.findOne({ nombre });
    if (productoExistente) {
      return res.status(400).json({ msg: "El producto con ese nombre ya existe" });
    }

    // Obtiene la URL segura de la imagen subida a Cloudinary
    const imagen = req.file.path;
    const imagen_id = req.file.filename;

    // Crea el nuevo producto
    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      beneficios,
      precio,
      stock, 
      id_categoria: id_categoria, 
      imagen,
      imagen_id,
    });

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

  try {
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    // Validaciones numéricas
    if (precio && (isNaN(precio) || precio <= 0)) {
      return res.status(400).json({ msg: "El precio debe ser un número positivo" });
    }

    if (cantidad && (isNaN(cantidad) || cantidad <= 0)) {
      return res.status(400).json({ msg: "La cantidad debe ser un número positivo" });
    }

    // Actualizar imagen si llegó una nueva
    if (req.file) {
      // 1. Eliminar la imagen anterior de Cloudinary si existe
      if (producto.imagen_id) {
        await cloudinary.uploader.destroy(producto.imagen_id);
      }

      // 2. Asignar nueva imagen
      producto.imagen = req.file.path;
      producto.imagen_id = req.file.filename;
    }

    // Actualizar resto de campos
    producto.nombre = nombre || producto.nombre;
    producto.descripcion = descripcion || producto.descripcion;
    producto.precio = precio || producto.precio;
    producto.stock = cantidad || producto.stock;
    producto.id_categoria = categoria || producto.id_categoria;

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
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    // Eliminar imagen en Cloudinary si existe
    if (producto.imagen_id) {
      await cloudinary.uploader.destroy(producto.imagen_id);
    }

    await producto.deleteOne();

    return res.status(200).json({ msg: `Producto eliminado con éxito`, producto });
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
