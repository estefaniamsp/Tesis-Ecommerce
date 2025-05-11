import Producto from "../models/productos.js";
import Ingrediente from "../models/ingredientes.js";
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
    const productos = await Producto.find({ activo: true })
      .populate('id_categoria')
      .populate('ingredientes')
      .skip(skip)
      .limit(limit);

    // Contar el total de productos
    const totalProductos = await Producto.countDocuments({ activo: true });

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
    const producto = await Producto.findById(id).populate('id_categoria').populate('ingredientes');

    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    if (!producto.activo) {
      return res.status(404).json({ msg: "Producto no disponible" });
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
  const ingredientesEnBD = await Ingrediente.find({ _id: { $in: ingredientes } });

  if (ingredientesEnBD.length !== ingredientes.length) {
    throw new Error('Uno o más ingredientes no existen en la base de datos.');
  }

  if (!nombre || !descripcion || !precio || !stock || !id_categoria || !aroma || !tipo || !req.file) {
    return res.status(400).json({ msg: "Todos los campos y la imagen son obligatorios" });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ msg: "El precio debe ser un número positivo" });
  }

  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ msg: "El stock debe ser un número mayor o igual a cero" });
  }

  if (!mongoose.Types.ObjectId.isValid(id_categoria)) {
    return res.status(400).json({ msg: "ID de categoría no válido" });
  }

  try {
    const productoExistente = await Producto.findOne({ nombre });
    if (productoExistente) {
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ msg: "El producto con ese nombre ya existe. Imagen eliminada." });
    }

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      beneficios,
      ingredientes,
      aroma,
      tipo,
      precio,
      stock,
      id_categoria,
      imagen: req.file.path,
      imagen_id: req.file.filename,
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
  let {
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

  // Parsear ingredientes si vienen como string en form-data
  if (typeof ingredientes === 'string') {
    try {
      ingredientes = JSON.parse(ingredientes);
    } catch {
      ingredientes = ingredientes.split(',').map(i => i.trim());
    }
  }

  // Parsear beneficios si vienen como string en form-data
  if (typeof beneficios === 'string') {
    try {
      beneficios = JSON.parse(beneficios);
    } catch {
      beneficios = beneficios.split(',').map(b => b.trim());
    }
  }

  // Validaciones básicas
  if (precio && (isNaN(precio) || precio <= 0)) {
    return res.status(400).json({ msg: "El precio debe ser un número positivo" });
  }

  if (cantidad && (isNaN(cantidad) || cantidad < 0)) {
    return res.status(400).json({ msg: "El stock debe ser un número positivo o 0" });
  }

  // Validar ingredientes si vienen
  if (ingredientes && Array.isArray(ingredientes)) {
    const ingredientesEnBD = await Ingrediente.find({ _id: { $in: ingredientes } });

    if (ingredientesEnBD.length !== ingredientes.length) {
      return res.status(400).json({ msg: "Uno o más ingredientes no existen en la base de datos" });
    }
  }

  try {
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    if (!producto.activo) {
      return res.status(400).json({ msg: "El producto está desactivado" });
    }

    // Reemplazo de imagen si llega una nueva
    if (req.file) {
      if (producto.imagen_id) {
        try {
          await cloudinary.uploader.destroy(producto.imagen_id);
        } catch (error) {
          console.warn("No se pudo eliminar la imagen previa:", error.message);
        }
      }
    }

    // Preparar campos a actualizar
    const camposActualizados = {
      nombre: nombre?.trim() || producto.nombre,
      descripcion: descripcion?.trim() || producto.descripcion,
      precio: precio || producto.precio,
      stock: cantidad !== undefined ? cantidad : producto.stock,
      id_categoria: categoria || producto.id_categoria,
      aroma: aroma?.trim() || producto.aroma,
      tipo: tipo?.trim() || producto.tipo,
      beneficios: Array.isArray(beneficios) && beneficios.length > 0 ? beneficios : producto.beneficios,
      ingredientes: Array.isArray(ingredientes) && ingredientes.length > 0 ? ingredientes : producto.ingredientes,
    };

    if (req.file) {
      camposActualizados.imagen = req.file.path;
      camposActualizados.imagen_id = req.file.filename;
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      id,
      { $set: camposActualizados },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ msg: "Producto actualizado exitosamente", producto: productoActualizado });

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

    if (!producto.activo) {
      return res.status(400).json({ msg: "El producto ya está desactivado" });
    }

    // Desactivar el producto (borrado lógico)
    const productoDesactivado = await Producto.findByIdAndUpdate(id, { activo: false }, { new: true });

    return res.status(200).json({ msg: "Producto desactivado con éxito", productoDesactivado });
  } catch (error) {
    console.error("Error al desactivar el producto:", error);
    return res.status(500).json({ msg: "Error al desactivar el producto", error: error.message });
  }
};

const reactivarProductoController = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de producto no válido" });
  }

  try {
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({ msg: "Producto no encontrado" });
    }

    if (producto.activo) {
      return res.status(400).json({ msg: "El producto ya está activo" });
    }

    producto.activo = true;
    await producto.save();

    return res.status(200).json({ msg: "Producto reactivado exitosamente", producto });
  } catch (error) {
    console.error("Error al reactivar el producto:", error);
    return res.status(500).json({ msg: "Error al reactivar el producto", error: error.message });
  }
};



export {
  createProductoController,
  getAllProductosController,
  getProductoByIDController,
  updateProductoController,
  deleteProductoController,
  reactivarProductoController,
};
