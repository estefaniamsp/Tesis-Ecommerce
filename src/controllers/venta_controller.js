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
const createVentaCliente = async (req, res) => {
  const { productos } = req.body;
  const clienteId = req.clienteBDD._id.toString();

  if (!productos || productos.length === 0) {
    return res.status(400).json({ msg: "Debes agregar al menos un producto" });
  }

  try {
    const clienteExistente = await Clientes.findById(clienteId);
    if (!clienteExistente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    let totalVenta = 0;
    const productosConDetalles = [];

    for (let i = 0; i < productos.length; i++) {
      const item = productos[i];
      const { producto_id, cantidad } = item;

      if (!producto_id || !cantidad) {
        return res.status(400).json({ msg: `Falta producto o cantidad en el índice ${i}` });
      }

      const producto = await Productos.findById(producto_id);
      if (!producto) {
        return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
      }

      // Verificar stock suficiente
      if (producto.stock < cantidad) {
        return res.status(400).json({ msg: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}` });
      }

      // Restar stock
      producto.stock -= cantidad;
      await producto.save();

      const subtotal = producto.precio * cantidad;
      totalVenta += subtotal;

      productosConDetalles.push({
        producto_id: producto._id,
        cantidad: cantidad,
        subtotal: subtotal,
      });
    }

    const nuevaVenta = new Ventas({
      cliente_id: clienteExistente._id,
      productos: productosConDetalles,
      total: totalVenta,
      estado: "pendiente",
    });

    await nuevaVenta.save();

    // 🔥 Filtrar los _id de productos antes de enviar la respuesta
    const ventaSinIdsInternos = {
      ...nuevaVenta._doc,
      productos: nuevaVenta.productos.map(p => {
        const { _id, ...resto } = p._doc;
        return resto;
      })
    };

    res.status(201).json({ msg: "Venta creada exitosamente", venta: ventaSinIdsInternos });

  } catch (error) {
    console.error("Error al crear venta:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
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
  createVentaCliente,
  updateVentaController,
  deleteVentaController,
};
