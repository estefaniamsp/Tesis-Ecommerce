import Ventas from "../models/ventas.js";
import Producto from "../models/productos.js";
import Clientes from "../models/clientes.js";
import Carrito from "../models/carritos.js";
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

// Actualizar el estado de una venta
const updateVentaController = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  // Validar ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ msg: "Lo sentimos, la venta no existe" });
  }

  // Validar estado
  if (!["pendiente", "finalizado"].includes(estado)) {
    return res.status(400).json({ msg: "Estado inválido" });
  }

  try {
    // Actualizar venta
    const ventaActualizada = await Ventas.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    ).populate("cliente_id", "nombre apellido email");

    if (!ventaActualizada) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    // Convertir todo el documento a objeto plano primero
    const ventaObj = ventaActualizada.toObject();

    // Formatear productos
    const productosFormateados = ventaObj.productos.map(p => ({
      ...p,
      producto: p.producto_id,
      producto_id: undefined // opcional: eliminar el campo original
    }));

    const ventaFormateada = {
      ...ventaObj,
      productos: productosFormateados
    };

    res.status(200).json({
      msg: "Venta actualizada con éxito",
      venta: ventaFormateada
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error al actualizar la venta",
      error: error.message
    });
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
        nombre: p.producto_id.nombre,
        imagen: p.producto_id.imagen,
        precio: p.producto_id.precio,
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

// Obtener estadísticas generales
const getDashboardController = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        msg: "Se requieren los parámetros 'fechaInicio' y 'fechaFin'."
      });
    }

    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T23:59:59`);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ msg: "Las fechas proporcionadas no son válidas." });
    }

    if (inicio > fin) {
      return res.status(400).json({ msg: "'fechaInicio' no puede ser mayor que 'fechaFin'." });
    }

    // 1. Total de clientes
    const numeroClientes = await Clientes.countDocuments();

    // 2. Ventas finalizadas entre fechas, con categoría de producto poblada
    const ventas = await Ventas.find({
      fecha_venta: { $gte: inicio, $lte: fin },
      estado: "finalizado"
    }).populate({
      path: "productos.producto_id",
      populate: { path: "id_categoria" }
    });

    // Inicializar mapa por día y contadores de categorías
    const ventasPorDia = {};
    let vendidos = { jabones: 0, velas: 0 };

    for (const venta of ventas) {
      // Formato de fecha: "dd/mm/yyyy"
      const fecha = venta.fecha_venta.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      // Acumular total por día
      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + venta.total;

      // Contar productos por categoría
      for (const p of venta.productos) {
        const categoriaNombre = p.producto_id?.id_categoria?.nombre?.toLowerCase().trim();

        if (categoriaNombre?.includes("jabon")) vendidos.jabones += p.cantidad;
        if (categoriaNombre?.includes("vela")) vendidos.velas += p.cantidad;
      }
    }

    // Generar lista de fechas completas en el rango y rellenar con 0 si no hubo ventas
    const ventasDiarias = [];
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const fecha = d.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      ventasDiarias.push({
        fecha,
        totalVentas: ventasPorDia[fecha] || 0
      });
    }

    const ventasPorCategoria = [
      { categoría: "jabones", vendidos: vendidos.jabones },
      { categoría: "velas", vendidos: vendidos.velas }
    ];

    return res.status(200).json({
      numeroClientes,
      ventasDiarias,
      ventasPorCategoria
    });

  } catch (error) {
    console.error("Error en dashboard:", error);
    return res.status(500).json({ msg: "Error en dashboard", error: error.message });
  }
};

export {
  getAllVentasController,
  getVentaByIDController,
  /*createVentaCliente,*/
  updateVentaController,
  deleteVentaController,
  getVentasClienteController,
  getFacturaClienteById,
  getDashboardController
};
