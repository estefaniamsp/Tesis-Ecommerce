import Clientes from "../models/clientes.js";
import Notificaciones from "../models/notificaciones.js";

const   actualizarTokenNotificacion = async (req, res) => {
  try {
    const clienteId = req.clienteBDD._id.toString();
    const { pushToken } = req.params;

    if (!pushToken) {
      return res.status(400).json({ msg: "Token de notificación no proporcionado" });
    }

    const cliente = await Clientes.findById(clienteId);

    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    cliente.notificationPushToken = pushToken !== "null" ? pushToken : null;

    await cliente.save();

    return res.status(200).json({ msg: "Token de notificación actualizado con éxito" });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ msg: "Error del servidor al actualizar el token de notificación" });
    }
  }
};

const enviarNotificacionesClientes = async (req, res) => {
  try {
    const admin = req.adminBDD._id.toString();

    if (!admin) {
      return res.status(403).json({ msg: "Acceso denegado, usuario no autorizado" });
    }

    const { titulo, mensaje, imagen } = req.body;

    if (!titulo || !mensaje || !imagen) {
      return res.status(400).json({ msg: "Título y mensaje son obligatorios" });
    }

    const clientes = await Clientes.find({
      notificationPushToken: { $exists: true, $ne: null },
    }).select("_id notificationPushToken");

    if (clientes.length === 0) {
      return res.status(404).json({ msg: "No hay clientes con tokens de notificación" });
    }

    const tokens = clientes.map(({ notificationPushToken }) => notificationPushToken);

    const notificacion = {
      to: tokens,
      sound: "default",
      title: titulo,
      body: mensaje,
      data: {
        image: imagen,
      },
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificacion),
    });

    const { ok } = response;

    if (!ok) {
      return res.status(500).json({ msg: "Error al enviar las notificaciones" });
    }

    for (const cliente of clientes) {
      const notificacion = new Notificaciones({
        cliente: cliente._id,
        titulo,
        mensaje,
        imagen,
      });
      await notificacion.save();
    };

    return res.status(200).json({ msg: "Notificaciones enviadas a todos los clientes" });
  } catch (error) {
    return res.status(500).json({ msg: "Error del servidor al enviar notificaciones" });
  }
};

const obtenerNotificacionesCliente = async (req, res) => {
  try {
    const clienteId = req.clienteBDD._id;

    const notificaciones = await Notificaciones.find({ cliente: clienteId })
      .sort({ fechaEnvio: -1 })
      .select("-__v");

    if (notificaciones.length === 0) {
      return res.status(404).json({ msg: "No hay notificaciones para este cliente" });
    }

    return res.status(200).json({notificaciones});
  } catch (error) {
    return res.status(500).json({ msg: "Error del servidor al obtener las notificaciones" });
  }
};

const obtenerTodasNotificacionesEnviadas = async (req, res) => {
  try {
    const admin = req.adminBDD._id.toString();

    if (!admin) {
      return res.status(403).json({ msg: "Acceso denegado, usuario no autorizado" });
    }

    const notificaciones = await Notificaciones.aggregate([
      {
        $group: {
          _id: "$titulo",
          doc: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$doc" },
      },
      {
        $project: { __v: 0 },
      },
      {
        $sort: { fechaEnvio: -1 },
      },
    ]);

    if (notificaciones.length === 0) {
      return res.status(404).json({ msg: "No hay notificaciones" });
    }

    return res.status(200).json({notificaciones});
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return res.status(500).json({ msg: "Error del servidor al obtener las notificaciones" });
  }
};

export {
  actualizarTokenNotificacion,
  enviarNotificacionesClientes,
  obtenerNotificacionesCliente,
  obtenerTodasNotificacionesEnviadas,
};
