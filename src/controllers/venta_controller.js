import Ventas from "../models/ventas.js";
import Producto from "../models/productos.js";
import Clientes from "../models/clientes.js";
import mongoose from "mongoose";

// Obtener todas las ventas
const getAllVentasController = async (req, res) => {
  try {
    // Extraer y convertir los parámetros de consulta
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    // Validar que 'page' y 'limit' sean números enteros positivos
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    // Obtener las ventas con paginación y población de referencias
    const ventas = await Ventas.find()
      .populate("cliente_id", "nombre apellido email")
      .populate("productos.producto_id", "nombre descripcion precio")
      .skip(skip)
      .limit(limit);

    // Contar el total de ventas
    const totalVentas = await Ventas.countDocuments();

    // Calcular el total de páginas
    const totalPaginas = Math.ceil(totalVentas / limit);

    // Verificar si se encontraron ventas
    if (ventas.length === 0) {
      return res.status(404).json({ msg: "No se encontraron ventas" });
    }

    // Responder con las ventas y la información de paginación
    return res.status(200).json({
      totalVentas,
      totalPaginas,
      paginaActual: page,
      ventas
    });
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return res.status(500).json({ msg: "Error al obtener las ventas", error: error.message });
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

      const producto = await Producto.findById(producto_id);
      if (!producto) {
        return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
      }

      if (!producto.activo) {
        return res.status(400).jason({msg: `El producto ${producto.nombre} está descontinuado y no puede ser añadido.`});
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

      const producto = await Producto.findById(producto_id);
      if (!producto) {
        return res.status(404).json({ msg: `Producto con ID ${producto_id} no encontrado.` });
      }

      if (!producto.activo) {
        return res.status(400).json({ msg: `El producto ${producto.nombre} está descontinuado y no puede ser añadido.` });
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
      const producto = await Producto.findById(item.producto_id);

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

const getVentasClienteController = async (req, res) => {
  try {
    const clienteId = req.clienteBDD._id;

    const ventasCliente = await Ventas.find({ cliente_id: clienteId })
      .populate("productos.producto_id", "nombre descripcion precio")
      .sort({ fecha_venta: -1 });

    if (!ventasCliente || ventasCliente.length === 0) {
      return res.status(404).json({ msg: "No se encontraron ventas asociadas a tu cuenta" });
    }

    res.status(200).json({ ventas: ventasCliente });
  } catch (error) {
    console.error("Error al obtener ventas del cliente:", error);
    res.status(500).json({ msg: "Error al obtener tus ventas" });
  }
};

const getFacturaClienteById = async (req, res) => {
  const { id } = req.params;
  const clienteId = req.clienteBDD._id;

  try {
    const venta = await Ventas.findById(id)
      .populate("cliente_id", "nombre apellido email");

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    // Asegurarse que el cliente solo vea su propia venta
    if (venta.cliente_id._id.toString() !== clienteId.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para ver esta venta" });
    }

    // Formato tipo factura
    const factura = {
      fecha: venta.fecha_venta,
      cliente: {
        nombre: venta.cliente_id.nombre,
        apellido: venta.cliente_id.apellido,
        email: venta.cliente_id.email
      },
      productos: venta.productos.map(p => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        subtotal: p.subtotal
      })),
      total: venta.total,
      estado: venta.estado
    };

    res.status(200).json({ factura });

  } catch (error) {
    console.error("Error al obtener factura del cliente:", error);
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
  getVentasClienteController,
  getFacturaClienteById
};
