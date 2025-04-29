import Producto from "../models/productos.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// Obtener todos los productos
const getAllProductosController = async (req, res) => {
  try {
    let { page, limit } = req.body;
    page = page || 1; // Página actual, por defecto 1
    limit = limit || 10; // Registros por página, por defecto 10
    const skip = (page - 1) * limit;

    const productos = await Producto.find()
      .populate('id_categoria')
      .skip(skip)
      .limit(limit);

    if (productos.length === 0) {
      return res.status(404).json({ msg: "No se encontraron productos" });
    }

    return res.status(200).json({ productos });
  } catch (error) {
    console.error("Error al obtener productos:", error);
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
  const {
    nombre,
    descripcion,
    precio,
    id_categoria,
    stock,
    aroma,
    tipo,
    ingredientes
  } = req.body;

  let beneficios = req.body.beneficios;

  // Normalizar beneficios
  if (!beneficios) {
    beneficios = [];
  } else if (typeof beneficios === "string") {
    beneficios = [beneficios];
  }

  // Normalizar ingredientes
  let parsedIngredientes = [];
  if (!ingredientes) {
    parsedIngredientes = [];
  } else if (typeof ingredientes === "string") {
    parsedIngredientes = [ingredientes];
  } else if (Array.isArray(ingredientes)) {
    parsedIngredientes = ingredientes;
  }

  // Validaciones básicas
  if (!nombre || !descripcion || !precio || !stock || !id_categoria || !aroma || !tipo) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  if (parsedIngredientes.length < 2) {
    return res.status(400).json({ msg: "Debes seleccionar al menos 2 ingredientes" });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ msg: "El precio debe ser un número positivo" });
  }

  if (!req.file) {
    return res.status(400).json({ msg: "La imagen del producto es obligatoria" });
  }

  try {
    const productoExistente = await Producto.findOne({ nombre });
    if (productoExistente) {
      return res.status(400).json({ msg: "El producto con ese nombre ya existe" });
    }

    // Subir imagen a carpeta "productos" en Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "productos"
    });

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      beneficios,
      ingredientes: parsedIngredientes,
      aroma,
      tipo,
      precio,
      stock,
      id_categoria,
      imagen: result.secure_url,
      imagen_id: result.public_id,
    });

    await nuevoProducto.save();

    return res.status(201).json({
      msg: "Producto creado exitosamente",
      producto: nuevoProducto,
    });
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return res.status(500).json({ msg: "Error al crear el producto", error });
  }
};

// Actualizar un producto
const updateProductoController = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    precio,
    cantidad,
    categoria,
    beneficios,
    ingredientes,
    aroma,
    tipo
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de producto no válido" });
  }

  try {
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    if (precio && (isNaN(precio) || precio <= 0)) {
      return res.status(400).json({ msg: "El precio debe ser un número positivo" });
    }

    if (cantidad && (isNaN(cantidad) || cantidad < 0)) {
      return res.status(400).json({ msg: "El stock debe ser un número positivo o 0" });
    }

    let parsedBeneficios = [];
    if (beneficios) {
      parsedBeneficios = typeof beneficios === "string"
        ? [beneficios]
        : Array.isArray(beneficios) ? beneficios : [];
    }

    let parsedIngredientes = [];
    if (ingredientes) {
      parsedIngredientes = typeof ingredientes === "string"
        ? [ingredientes]
        : Array.isArray(ingredientes) ? ingredientes : [];
    }

    // 🚀 Actualizar imagen subiéndola a carpeta "productos"
    if (req.file) {
      if (producto.imagen_id) {
        await cloudinary.uploader.destroy(producto.imagen_id);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "productos"
      });

      producto.imagen = result.secure_url;
      producto.imagen_id = result.public_id;
    }

    producto.nombre = nombre || producto.nombre;
    producto.descripcion = descripcion || producto.descripcion;
    producto.precio = precio || producto.precio;
    producto.stock = cantidad || producto.stock;
    producto.id_categoria = categoria || producto.id_categoria;
    producto.aroma = aroma || producto.aroma;
    producto.tipo = tipo || producto.tipo;

    if (parsedBeneficios.length > 0) {
      producto.beneficios = parsedBeneficios;
    }

    if (parsedIngredientes.length > 0) {
      producto.ingredientes = parsedIngredientes;
    }

    await producto.save();

    return res.status(200).json({ msg: "Producto actualizado exitosamente", producto });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
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
