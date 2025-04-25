import Ventas from "../models/ventas.js";
import Productos from "../models/productos.js";
import Clientes from "../models/clientes.js";
import mongoose from "mongoose";

// Obtener todas las ventas
const getAllVentasController = async (req, res) => {
  try {
    const ventas = await Ventas.find()
      .populate("cliente_id", "nombre apellido email")
      .populate("productos.producto_id", "nombre descripcion precio");

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
      .populate("cliente_id", "nombre apellido email")
      .populate("productos.producto_id", "nombre descripcion precio");

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    // Formatear la respuesta para que el frontend reciba campos claros
    const ventaFormateada = {
      ...venta._doc,
      cliente: venta.cliente_id,
      productos: venta.productos.map(p => ({
        ...p._doc,
        producto: p.producto_id
      }))
    };

    res.status(200).json(ventaFormateada);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear una nueva venta
const createVentaCliente = async (req, res) => {
  const { productos } = req.body;
  const clienteId = req.clienteBDD._id.toString();

  // Verificar si productos existe y no está vacío
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
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
      const producto_id = item.producto_id ? item.producto_id.toString().trim() : "";
      const cantidad = item.cantidad;

      // Validar campos vacíos o espacios
      if (!producto_id || producto_id.length === 0) {
        return res.status(400).json({ msg: `El campo "producto_id" está vacío o mal formado en el índice ${i}` });
      }

      if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({ msg: `El campo "cantidad" es inválido en el índice ${i}` });
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

    // 🔥 Limpiar _id de productos
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

const createVentaAdmin = async (req, res) => {
  let { productos, cliente_id } = req.body;

  // Limpiar espacios
  cliente_id = cliente_id ? cliente_id.toString().trim() : "";

  // Validar cliente_id
  if (!cliente_id) {
    return res.status(400).json({ msg: "Debes proporcionar el ID del cliente" });
  }

  // Validar productos
  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ msg: "Debes agregar al menos un producto" });
  }

  try {
    const clienteExistente = await Clientes.findById(cliente_id);
    if (!clienteExistente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    let totalVenta = 0;
    const productosConDetalles = [];

    for (let i = 0; i < productos.length; i++) {
      const item = productos[i];
      const producto_id = item.producto_id ? item.producto_id.toString().trim() : "";
      const cantidad = item.cantidad;

      // Validaciones estrictas
      if (!producto_id || producto_id.length === 0) {
        return res.status(400).json({ msg: `El campo "producto_id" está vacío o mal formado en el índice ${i}` });
      }

      if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({ msg: `El campo "cantidad" es inválido en el índice ${i}` });
      }

      const producto = await Productos.findById(producto_id);
      if (!producto) {
        return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
      }

      if (producto.stock < cantidad) {
        return res.status(400).json({ msg: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}` });
      }

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

    //Limpiar _id internos antes de responder
    const ventaSinIdsInternos = {
      ...nuevaVenta._doc,
      productos: nuevaVenta.productos.map(p => {
        const { _id, ...resto } = p._doc;
        return resto;
      })
    };

    res.status(201).json({ msg: "Venta creada exitosamente", venta: ventaSinIdsInternos });

  } catch (error) {
    console.error("Error al crear venta por admin:", error);
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
    const ventaActualizada = await Ventas.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    )
      .populate("cliente_id", "nombre apellido email")
      .populate("productos.producto_id", "nombre descripcion precio");

    if (!ventaActualizada) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    // Formatear respuesta
    const ventaFormateada = {
      ...ventaActualizada._doc,
      cliente: ventaActualizada.cliente_id,
      productos: ventaActualizada.productos.map(p => ({
        ...p._doc,
        producto: p.producto_id
      }))
    };

    res.status(200).json({ msg: "Venta actualizada con éxito", venta: ventaFormateada });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar una venta
const deleteVentaController = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de venta no válido" });
  }

  try {
    const venta = await Ventas.findById(id);

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    // Recuperar stock de productos
    for (const item of venta.productos) {
      const producto = await Productos.findById(item.producto_id);

      if (producto) {
        producto.stock += item.cantidad;
        await producto.save();
      }
    }

    // Eliminar la venta después de ajustar el stock
    const ventaEliminada = await Ventas.findByIdAndDelete(id);

    res.status(200).json({
      msg: "Venta eliminada exitosamente y stock recuperado",
      ventaEliminada: {
        _id: ventaEliminada._id,
        total: ventaEliminada.total,
        estado: ventaEliminada.estado,
        fecha_venta: ventaEliminada.fecha_venta
      }
    });
  } catch (error) {
    console.error("Error al eliminar venta:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export {
  getAllVentasController,
  getVentaByIDController,
  createVentaCliente,
  createVentaAdmin,
  updateVentaController,
  deleteVentaController,
};
