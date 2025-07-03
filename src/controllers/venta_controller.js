import Ventas from "../models/ventas.js";
import Producto from "../models/productos.js";
import Clientes from "../models/clientes.js";
import ProductoPersonalizado from "../models/productosPersonalizados.js";
import mongoose from "mongoose";

// Obtener todas las ventas
const getAllVentasController = async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    const skip = (page - 1) * limit;

    const ventasRaw = await Ventas.find()
      .populate("cliente_id", "nombre apellido email")
      .skip(skip)
      .limit(limit)
      .sort({ fecha_venta: -1 });

    const totalVentas = await Ventas.countDocuments();
    const totalPaginas = Math.ceil(totalVentas / limit);

    if (ventasRaw.length === 0) {
      return res.status(404).json({ msg: "No se encontraron ventas" });
    }

    const ventas = [];

    for (const venta of ventasRaw) {
      const productos = [];

      for (const item of venta.productos) {
        let producto = await Producto.findById(item.producto_id);
        if (producto) {
          productos.push({
            producto_id: producto._id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            imagen: producto.imagen,
            precio: producto.precio,
            cantidad: item.cantidad,
            subtotal: item.subtotal
          });
        } else {
          const personalizado = await ProductoPersonalizado.findById(item.producto_id)
            .populate("ingredientes", "nombre imagen")
            .populate("id_categoria", "nombre");

          if (personalizado) {
            productos.push({
              producto_id: personalizado._id,
              tipo: personalizado.tipo_producto,
              aroma: personalizado.aroma,
              imagen: personalizado.imagen,
              precio: personalizado.precio,
              categoria: personalizado.id_categoria?.nombre || "sin categoría",
              ingredientes: personalizado.ingredientes?.map(i => ({
                _id: i._id,
                nombre: i.nombre,
                imagen: i.imagen,
                tipo:i.tipo
              })),
              cantidad: item.cantidad,
              subtotal: item.subtotal
            });
          }
        }
      }

      ventas.push({
        _id: venta._id,
        cliente: venta.cliente_id,
        fecha_venta: venta.fecha_venta,
        total: venta.total,
        estado: venta.estado,
        productos
      });
    }

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
      .populate("cliente_id", "nombre apellido email");

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    const productos = [];

    for (const item of venta.productos) {
      let producto = await Producto.findById(item.producto_id);

      if (producto) {
        productos.push({
          producto_id: producto._id,
          tipo: "normal",
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          imagen: producto.imagen,
          precio: producto.precio,
          cantidad: item.cantidad,
          subtotal: item.subtotal
        });
      } else {
        const personalizado = await ProductoPersonalizado.findById(item.producto_id)
          .populate("ingredientes", "nombre imagen")
          .populate("id_categoria", "nombre");

        if (personalizado) {
          productos.push({
            producto_id: personalizado._id,
            tipo: "personalizado",
            aroma: personalizado.aroma,
            imagen: personalizado.imagen,
            precio: personalizado.precio,
            categoria: personalizado.id_categoria?.nombre || "sin categoría",
            ingredientes: personalizado.ingredientes?.map(i => ({
              _id: i._id,
              nombre: i.nombre,
              imagen: i.imagen
            })),
            cantidad: item.cantidad,
            subtotal: item.subtotal
          });
        }
      }
    }

    const ventaFormateada = {
      _id: venta._id,
      cliente: venta.cliente_id,
      fecha_venta: venta.fecha_venta,
      total: venta.total,
      estado: venta.estado,
      productos
    };

    res.status(200).json(ventaFormateada);

  } catch (error) {
    console.error("getVentaByIDController:", error);
    res.status(500).json({ msg: "Error interno", error: error.message });
  }
};

// Actualizar el estado de una venta
const updateVentaController = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ msg: "Lo sentimos, la venta no existe" });
  }

  if (!["pendiente", "finalizado"].includes(estado)) {
    return res.status(400).json({ msg: "Estado inválido" });
  }

  try {
    const ventaActualizada = await Ventas.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    ).populate("cliente_id", "nombre apellido email");

    if (!ventaActualizada) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    const productos = [];

    for (const item of ventaActualizada.productos) {
      let producto = await Producto.findById(item.producto_id);

      if (producto) {
        productos.push({
          producto_id: producto._id,
          tipo: "normal",
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          imagen: producto.imagen,
          precio: producto.precio,
          cantidad: item.cantidad,
          subtotal: item.subtotal
        });
      } else {
        const personalizado = await ProductoPersonalizado.findById(item.producto_id)
          .populate("ingredientes", "nombre imagen")
          .populate("id_categoria", "nombre");

        if (personalizado) {
          productos.push({
            producto_id: personalizado._id,
            tipo: "personalizado",
            aroma: personalizado.aroma,
            imagen: personalizado.imagen,
            precio: personalizado.precio,
            categoria: personalizado.id_categoria?.nombre || "sin categoría",
            ingredientes: personalizado.ingredientes?.map(i => ({
              _id: i._id,
              nombre: i.nombre,
              imagen: i.imagen
            })),
            cantidad: item.cantidad,
            subtotal: item.subtotal
          });
        }
      }
    }

    const ventaFormateada = {
      _id: ventaActualizada._id,
      cliente: ventaActualizada.cliente_id,
      total: ventaActualizada.total,
      estado: ventaActualizada.estado,
      fecha_venta: ventaActualizada.fecha_venta,
      productos
    };

    res.status(200).json({
      msg: "Venta actualizada con éxito",
      venta: ventaFormateada
    });

  } catch (error) {
    console.error("updateVentaController:", error);
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
        // Producto normal
        producto.stock += item.cantidad;
        await producto.save();
      } else {
        // Producto personalizado (ya fue eliminado en la venta)
        const productoPers = await ProductoPersonalizado.findById(item.producto_id).populate("ingredientes");

        if (productoPers) {
          for (const ingrediente of productoPers.ingredientes) {
            ingrediente.stock += item.cantidad;
            await ingrediente.save();
          }
        }
      }
    }

    // Eliminar la venta después de ajustar stock
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

    const ventasRaw = await Ventas.find({ cliente_id: clienteId })
      .populate("cliente_id", "nombre apellido email")
      .sort({ fecha_venta: -1 });

    if (!ventasRaw || ventasRaw.length === 0) {
      return res.status(404).json({ msg: "No se encontraron ventas asociadas a tu cuenta" });
    }

    const ventas = [];

    for (const venta of ventasRaw) {
      const productos = [];

      for (const item of venta.productos) {
        let producto = await Producto.findById(item.producto_id);

        if (producto) {
          productos.push({
            producto_id: producto._id,
            tipo: "normal",
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            imagen: producto.imagen,
            precio: producto.precio,
            cantidad: item.cantidad,
            subtotal: item.subtotal
          });
        } else {
          const personalizado = await ProductoPersonalizado.findById(item.producto_id)
            .populate("ingredientes", "nombre imagen")
            .populate("id_categoria", "nombre");

          if (personalizado) {
            productos.push({
              producto_id: personalizado._id,
              tipo: personalizado.tipo_producto,
              aroma: personalizado.aroma,
              imagen: personalizado.imagen,
              precio: personalizado.precio,
              categoria: personalizado.id_categoria?.nombre || "sin categoría",
              ingredientes: personalizado.ingredientes?.map(i => ({
                _id: i._id,
                nombre: i.nombre,
                imagen: i.imagen
              })),
              cantidad: item.cantidad,
              subtotal: item.subtotal
            });
          }
        }
      }

      ventas.push({
        _id: venta._id,
        fecha_venta: venta.fecha_venta,
        estado: venta.estado,
        total: venta.total,
        productos
      });
    }

    res.status(200).json({ ventas });

  } catch (error) {
    console.error("Error al obtener ventas del cliente:", error);
    res.status(500).json({ msg: "Error al obtener tus ventas", error: error.message });
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

    if (venta.cliente_id._id.toString() !== clienteId.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para ver esta venta" });
    }

    const productos = [];

    for (const item of venta.productos) {
      let producto = null;

      // Intentar cargar como producto normal
      producto = await Producto.findById(item.producto_id);

      if (producto) {
        productos.push({
          producto_id: producto._id,
          nombre: producto.nombre,
          imagen: producto.imagen,
          precio: producto.precio,
          cantidad: item.cantidad,
          subtotal: item.subtotal
        });
      } else {
        // Si no está en productos normales, buscar en personalizados
        const productoPers = await ProductoPersonalizado.findById(item.producto_id)
          .populate("ingredientes", "nombre imagen")
          .populate("id_categoria", "nombre");

        if (productoPers) {
          productos.push({
            producto_id: productoPers._id,
            tipo: "personalizado",
            aroma: productoPers.aroma,
            imagen: productoPers.imagen,
            precio: productoPers.precio,
            categoria: productoPers.id_categoria?.nombre || "sin categoría",
            ingredientes: productoPers.ingredientes?.map(i => ({
              _id: i._id,
              nombre: i.nombre,
              imagen: i.imagen
            })),
            cantidad: item.cantidad,
            subtotal: item.subtotal
          });
        }
      }
    }

    const factura = {
      fecha: venta.fecha_venta,
      cliente: {
        nombre: venta.cliente_id.nombre,
        apellido: venta.cliente_id.apellido,
        email: venta.cliente_id.email
      },
      productos,
      total: venta.total,
      estado: venta.estado
    };

    res.status(200).json({ factura });

  } catch (error) {
    console.error("getFacturaClienteById:", error);
    return res.status(500).json({ msg: "Error interno", error: error.message });
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

    const inicio = new Date(`${fechaInicio}T00:00:00-05:00`); 
    const fin = new Date(`${fechaFin}T23:59:59-05:00`); 

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ msg: "Las fechas proporcionadas no son válidas." });
    }

    if (inicio > fin) {
      return res.status(400).json({ msg: "'fechaInicio' no puede ser mayor que 'fechaFin'." });
    }

    // 1. Total de clientes
    const numeroClientes = await Clientes.countDocuments();

    // 2. Obtener ventas finalizadas en ese rango
    const ventas = await Ventas.find({
      fecha_venta: { $gte: inicio, $lte: fin },
      estado: "finalizado"
    });

    // Inicializar estructuras de acumulación
    const ventasPorDia = {};
    let vendidos = { jabones: 0, velas: 0 };

    for (const venta of ventas) {
      // Total por día
      const fecha = venta.fecha_venta.toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + venta.total;

      for (const p of venta.productos) {
        let categoria = null;

        const producto = await Producto.findById(p.producto_id).populate("id_categoria", "nombre");
        if (producto) {
          categoria = producto.id_categoria?.nombre?.toLowerCase();
        } else {
          const personalizado = await ProductoPersonalizado.findById(p.producto_id).populate("id_categoria", "nombre");
          if (personalizado) {
            categoria = personalizado.id_categoria?.nombre?.toLowerCase();
          }
        }

        if (categoria?.includes("jabon")) vendidos.jabones += p.cantidad;
        if (categoria?.includes("vela")) vendidos.velas += p.cantidad;
      }
    }

    // Fechas completas para el gráfico
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
  updateVentaController,
  deleteVentaController,
  getVentasClienteController,
  getFacturaClienteById,
  getDashboardController
};
