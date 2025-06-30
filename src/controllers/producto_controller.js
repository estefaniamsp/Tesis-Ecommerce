import Producto from "../models/productos.js";
import Ingrediente from "../models/ingredientes.js";
import Categoria from "../models/categorias.js";
import VistaProducto from "../models/vistaProducto.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

const jabonesTipos = ["piel seca", "piel grasa", "piel mixta"];
const velasTipos = ["decorativa", "aromatizante", "humidificación"];

// Obtener todos los productos
const getAllProductosController = async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    const { nombre, tipo } = req.query;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    const filtro = { activo: true };
    if (nombre) filtro.nombre = { $regex: nombre, $options: 'i' };
    if (tipo) filtro.tipo = { $regex: tipo, $options: 'i' };

    const productos = await Producto.find(filtro)
      .populate('id_categoria')
      .populate('ingredientes')
      .skip(skip)
      .limit(limit);

    const totalProductos = await Producto.countDocuments(filtro);
    const totalPaginas = Math.ceil(totalProductos / limit);

    if (productos.length === 0) {
      return res.status(404).json({ msg: "No se encontraron productos" });
    }

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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de producto no válido" });
  }

  try {
    const producto = await Producto.findById(id)
      .populate('id_categoria')
      .populate('ingredientes');

    if (!producto || !producto.activo) {
      return res.status(404).json({ msg: "Producto no disponible" });
    }

    // 🔒 Si hay un cliente logueado, registrar vista automáticamente
    if (req.clienteBDD) {
      try {
        await VistaProducto.create({
          cliente_id: req.clienteBDD._id,
          producto_id: producto._id,
        });
      } catch (vistaError) {
        console.warn("No se pudo registrar vista del producto:", vistaError.message);
      }
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

  // Parseo y limpieza de beneficios
  if (typeof beneficios === "string") {
    try {
      beneficios = JSON.parse(beneficios);
    } catch {
      beneficios = beneficios.split(',').map(b => b.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(beneficios) || beneficios.length < 3) {
    return res.status(400).json({ msg: "Debes proporcionar al menos 3 beneficios no vacíos." });
  }

  if (!nombre || !descripcion || !precio || !stock || !id_categoria || !aroma || !tipo || !req.file) {
    return res.status(400).json({ msg: "Todos los campos y la imagen son obligatorios" });
  }

  if (isNaN(precio) || precio < 0 || precio > 1000) {
    return res.status(400).json({ msg: "El precio debe ser un número entre $0 y $100." });
  }

  if (isNaN(stock) || stock < 0 || stock > 100) {
    return res.status(400).json({ msg: "El stock debe ser un número entre 0 y 100 unidades." });
  }

  if (!mongoose.Types.ObjectId.isValid(id_categoria)) {
    return res.status(400).json({ msg: "ID de categoría no válido" });
  }

  try {
    const ingredientesEnBD = await Ingrediente.find({ _id: { $in: ingredientes } });
    if (ingredientesEnBD.length !== ingredientes.length) {
      return res.status(400).json({ msg: "Uno o más ingredientes no existen en la base de datos." });
    }

    const categoria = await Categoria.findById(id_categoria);
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    const nombreCategoria = categoria.nombre.toLowerCase();

    if (nombreCategoria.includes("jabones") && !jabonesTipos.includes(tipo.toLowerCase())) {
      return res.status(400).json({ msg: "Tipo inválido para 'Jabones artesanales'." });
    }

    if (nombreCategoria.includes("velas") && !velasTipos.includes(tipo.toLowerCase())) {
      return res.status(400).json({ msg: "Tipo inválido para 'Velas artesanales'." });
    }

    const productoExistente = await Producto.findOne({
      nombre: { $regex: `^${nombre}$`, $options: 'i' }
    });

    if (productoExistente) {
      await cloudinary.uploader.destroy(req.file.filename);
      return res.status(400).json({ msg: "Ya existe un producto con ese nombre." });
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
    await nuevoProducto.populate("ingredientes", "nombre");

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
    stock,
    id_categoria,
    beneficios,
    ingredientes,
    aroma,
    tipo
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de producto no válido" });
  }

  // Parsear ingredientes
  if (typeof ingredientes === 'string') {
    try {
      ingredientes = JSON.parse(ingredientes);
    } catch {
      ingredientes = ingredientes.split(',').map(i => i.trim());
    }
  }

  // Parsear beneficios
  if (typeof beneficios === 'string') {
    try {
      beneficios = JSON.parse(beneficios);
    } catch {
      beneficios = beneficios.split(',').map(b => b.trim());
    }
  }

  // Limpiar array de beneficios vacíos si ya viene como array
  if (Array.isArray(beneficios)) {
    beneficios = beneficios.map(b => b.trim()).filter(b => b.length > 0);
  }

  // Validar mínimo 3 beneficios si se están enviando
  if (beneficios !== undefined && beneficios.length < 3) {
    return res.status(400).json({ msg: "Debes proporcionar al menos 3 beneficios no vacíos." });
  }

  if (precio !== undefined && (isNaN(precio) || precio < 0)) {
    return res.status(400).json({ msg: "El precio debe ser un número mayor o igual a 0" });
  }

  if (stock !== undefined && (isNaN(stock) || stock < 0)) {
    return res.status(400).json({ msg: "El stock debe ser un número mayor o igual a 0" });
  }

  if (ingredientes && Array.isArray(ingredientes)) {
    const ingredientesEnBD = await Ingrediente.find({ _id: { $in: ingredientes } });
    if (ingredientesEnBD.length !== ingredientes.length) {
      return res.status(400).json({ msg: "Uno o más ingredientes no existen en la base de datos" });
    }
  }

  try {
    const producto = await Producto.findById(id);
    if (!producto) return res.status(404).json({ msg: "Producto no encontrado" });
    if (!producto.activo) return res.status(400).json({ msg: "El producto está desactivado" });

    // Validar nombre único si se cambia
    if (nombre && nombre.trim() !== producto.nombre) {
      const nombreExistente = await Producto.findOne({
        _id: { $ne: id },
        nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' }
      });
      if (nombreExistente) {
        return res.status(400).json({ msg: "Ya existe otro producto con ese nombre." });
      }
    }

    // Validar tipo si cambia de categoría
    if (
      id_categoria &&
      id_categoria.toString() !== producto.id_categoria.toString()
    ) {
      const cat = await Categoria.findById(id_categoria);
      if (!cat) return res.status(404).json({ msg: "Categoría no encontrada" });

      const nombreCategoria = cat.nombre.toLowerCase();

      if (!tipo) {
        return res.status(400).json({
          msg: `Debes enviar un tipo válido para la nueva categoría '${cat.nombre}'.`,
        });
      }

      const tipoEvaluar = tipo.trim().toLowerCase();
      if (nombreCategoria.includes("jabones") && !jabonesTipos.includes(tipoEvaluar)) {
        return res.status(400).json({ msg: "Tipo inválido para 'Jabones artesanales'." });
      }

      if (nombreCategoria.includes("velas") && !velasTipos.includes(tipoEvaluar)) {
        return res.status(400).json({ msg: "Tipo inválido para 'Velas artesanales'." });
      }
    }

    // Reemplazar imagen si se envió una nueva
    if (req.file && producto.imagen_id) {
      try {
        await cloudinary.uploader.destroy(producto.imagen_id);
      } catch (e) {
        console.warn("Error al eliminar imagen previa:", e.message);
      }
    }

    const camposActualizados = {
      nombre: nombre?.trim() || producto.nombre,
      descripcion: descripcion?.trim() || producto.descripcion,
      precio: precio !== undefined ? precio : producto.precio,
      stock: stock !== undefined ? stock : producto.stock,
      id_categoria: id_categoria !== undefined ? id_categoria : producto.id_categoria,
      aroma: aroma?.trim() || producto.aroma,
      tipo: tipo?.trim() || producto.tipo,
      beneficios: beneficios !== undefined ? beneficios : producto.beneficios,
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
    ).populate("ingredientes", "nombre");

    return res.status(200).json({
      msg: "Producto actualizado exitosamente",
      producto: productoActualizado
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return res.status(500).json({
      msg: "Error al actualizar el producto",
      error: error.message
    });
  }
};

// Desactivar un producto
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
  reactivarProductoController
};
