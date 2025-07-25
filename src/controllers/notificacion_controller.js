import Clientes from "../models/clientes.js";
import Notificaciones from "../models/notificaciones.js";

const actualizarTokenNotificacion = async (req, res) => {
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

    const { titulo, mensaje, imagen, clienteId } = req.body;

    if (!titulo || !mensaje || !imagen) {
      return res.status(400).json({ msg: "Título y mensaje son obligatorios" });
    }

    let tokens = [];
    let clientesId = [];

    if (clienteId) {
      const { notificationPushToken = null } = await Clientes.findById(clienteId).select(
        "notificationPushToken"
      );

      if (notificationPushToken) {
        tokens.push(notificationPushToken);
        clientesId.push(clienteId);
      }
    } else {
      const clientes = await Clientes.find({
        notificationPushToken: {
          $exists: true,
          $ne: null,
          $regex: /^ExponentPushToken\[[a-zA-Z0-9_-]+\]/,
        },
      }).select("_id notificationPushToken");

      if (clientes.length === 0) {
        return res.status(404).json({ msg: "No hay clientes con tokens de notificación" });
      }

      clientes.forEach(({ notificationPushToken, _id }) => {
        tokens.push(notificationPushToken);
        clientesId.push(_id);
      });
    }

    const notificacion = {
      to: tokens,
      sound: "default",
      title: titulo,
      body: mensaje,
      richContent: {
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

    const notificacionBDD = new Notificaciones({
      clientes: clientesId,
      titulo,
      mensaje,
      imagen,
    });
    await notificacionBDD.save();

    return res.status(200).json({ msg: "Notificaciones enviadas a todos los clientes" });
  } catch (error) {
    return res.status(500).json({ msg: "Error del servidor al enviar notificaciones" });
  }
};

const obtenerNotificacionesCliente = async (req, res) => {
  try {
    const clienteId = req.clienteBDD._id.toString();

    const notificaciones = await Notificaciones.find({
      clientes: { $in: [clienteId] },
    }).select("titulo mensaje imagen createdAt");

    if (notificaciones.length === 0) {
      return res.status(404).json({ msg: "No hay notificaciones para este cliente" });
    }

    return res.status(200).json({ notificaciones });
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

    const notificaciones = await Notificaciones.find();

    if (notificaciones.length === 0) {
      return res.status(404).json({ msg: "No hay notificaciones" });
    }

    return res.status(200).json({ notificaciones });
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
