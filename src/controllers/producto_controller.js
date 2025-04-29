import Producto from "../models/productos.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

// Obtener todos los productos
const getAllProductosController = async (req, res) => {
  try {
    // Extraer y convertir los parámetros de consulta
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    // Validar que 'page' y 'limit' sean números enteros positivos
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    // Obtener los productos con paginación y población de la categoría
    const productos = await Producto.find()
      .populate('id_categoria')
      .skip(skip)
      .limit(limit);

    // Contar el total de productos
    const totalProductos = await Producto.countDocuments();

    // Calcular el total de páginas
    const totalPaginas = Math.ceil(totalProductos / limit);

    // Verificar si se encontraron productos
    if (productos.length === 0) {
      return res.status(404).json({ msg: "No se encontraron productos" });
    }

    // Responder con los productos y la información de paginación
    return res.status(200).json({
      totalProductos,
      totalPaginas,
      paginaActual: page,
      productos
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return res.status(500).json({ msg: "Error al obtener los productos", error: error.message });
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
  let {
    nombre,
    descripcion,
    precio,
    id_categoria,
    stock,
    aroma,
    tipo,
    ingredientes,
    beneficios,
  } = req.body;

  nombre = nombre?.trim();
  descripcion = descripcion?.trim();
  aroma = aroma?.trim();
  tipo = tipo?.trim();

  beneficios = !beneficios ? [] : typeof beneficios === "string" ? [beneficios] : beneficios;
  let parsedIngredientes = !ingredientes ? [] : typeof ingredientes === "string" ? [ingredientes] : ingredientes;

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
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ msg: "El producto con ese nombre ya existe. Imagen eliminada." });
    }

    const result = await cloudinary.uploader.upload(req.file.path, { folder: "productos" });

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

    return res.status(201).json({ msg: "Producto creado exitosamente", producto: nuevoProducto });

  } catch (error) {
    console.error("Error al crear el producto:", error);
    if (req.file?.filename) await cloudinary.uploader.destroy(req.file.filename);
    return res.status(500).json({ msg: "Error al crear el producto", error: error.message });
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

    producto.nombre = nombre ? nombre.trim() : producto.nombre;
    producto.descripcion = descripcion ? descripcion.trim() : producto.descripcion;
    producto.precio = precio || producto.precio;
    producto.stock = cantidad !== undefined ? cantidad : producto.stock;
    producto.id_categoria = categoria || producto.id_categoria;
    producto.aroma = aroma ? aroma.trim() : producto.aroma;
    producto.tipo = tipo ? tipo.trim() : producto.tipo;

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
    return res.status(500).json({ msg: "Error al actualizar el producto", error: error.message });
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
