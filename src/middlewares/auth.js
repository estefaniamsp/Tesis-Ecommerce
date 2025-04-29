// Importar JWT y el Modelo
import jwt from "jsonwebtoken";
import Clientes from "../models/clientes.js";
import Admin from "../models/administrador.js";
// Método para proteger rutas
const verificarAutenticacion = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token no proporcionado o con formato inválido" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const cliente = await Clientes.findById(id).select("-password");
    if (cliente) {
      req.clienteBDD = cliente;
      return next();
    }

    const admin = await Admin.findById(id).select("-password");
    if (admin) {
      req.adminBDD = admin;
      return next();
    }

    return res.status(403).json({ msg: "Acceso denegado: usuario no autorizado" });

  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

// Exportar el método
export default verificarAutenticacion;
