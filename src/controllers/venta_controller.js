import Ventas from "../models/ventas.js";
import Productos from "../models/productos.js";
import Clientes from "../models/clientes.js";
import mongoose from "mongoose";

// Obtener todas las ventas
const getAllVentasController = async (req, res) => {
  try {
    const ventas = await Ventas.find().populate("cliente", "nombre apellido email").populate("productos.producto", "nombre descripcion precio");
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener una venta por su ID
const getVentaByIDController = async (req, res) => {
  const { id } = req.params;
  try {
    const venta = await Ventas.findById(id)
      .populate("cliente", "nombre apellido email")
      .populate("productos.producto", "nombre descripcion precio");

    const status = venta ? 200 : 404;
    res.status(status).json(venta || { msg: "Venta no encontrada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear una nueva venta
const createVentaController = async (req, res) => {
  const { clienteId, productos } = req.body;

  // Verificar si hay campos vacíos
  if (Object.values(req.body).includes("")) {
    return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
  }

  try {
    // Verificar si el cliente existe
    const clienteExistente = await Clientes.findById(clienteId);
    if (!clienteExistente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    // Calcular el total de la venta
    let totalVenta = 0;
    const productosConDetalles = [];

    for (let i = 0; i < productos.length; i++) {
      const producto = await Productos.findById(productos[i].producto);

      if (!producto) {
        return res.status(404).json({ msg: `Producto con ID ${productos[i].producto} no encontrado.` });
      }

      const subtotal = producto.precio * productos[i].cantidad;
      totalVenta += subtotal;

      productosConDetalles.push({
        producto: producto._id,
        cantidad: productos[i].cantidad,
        precio_unitario: producto.precio,
        subtotal: subtotal,
      });
    }

    // Crear y guardar la nueva venta
    const nuevaVenta = new Ventas({
      cliente: clienteExistente._id,
      productos: productosConDetalles,
      total: totalVenta,
      estado: "pendiente",
    });

    await nuevaVenta.save();
    res.status(201).json({ msg: "Venta creada exitosamente", venta: nuevaVenta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar el estado de una venta
const updateVentaController = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  // Verificar si el estado es válido
  if (!["pendiente", "completada", "cancelada"].includes(estado)) {
    return res.status(400).json({ msg: "Estado inválido" });
  }

  // Verificar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ msg: "Lo sentimos, la venta no existe" });
  }

  try {
    // Actualizar la venta
    const ventaActualizada = await Ventas.findByIdAndUpdate(id, { estado }, { new: true });

    if (!ventaActualizada) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    res.status(200).json({ msg: "Venta actualizada con éxito", venta: ventaActualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar una venta
const deleteVentaController = async (req, res) => {
  const { id } = req.params;

  // Verificar si el ID es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ msg: "Lo sentimos, la venta no existe" });
  }

  try {
    // Eliminar la venta
    const ventaEliminada = await Ventas.findByIdAndDelete(id);

    if (!ventaEliminada) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    res.status(200).json({ msg: `La venta con id ${id} fue eliminada exitosamente` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  getAllVentasController,
  getVentaByIDController,
  createVentaController,
  updateVentaController,
  deleteVentaController,
};
