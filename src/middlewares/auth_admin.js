// Importar JWT y el Modelo de Administrador
import jwt from "jsonwebtoken";
import Admin from "../models/administrador.js";

const verificarAdmin = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ msg: "Acceso denegado, se requiere un token" });
  }

  const { authorization } = req.headers;

  try {
    // Verificar el token
    const { id } = jwt.verify(authorization.split(" ")[1], process.env.JWT_SECRET);

    // Buscar al administrador en la base de datos
    const adminBDD = await Admin.findById(id).lean();
    if (!adminBDD) {
      return res.status(403).json({ msg: "No tienes permisos de administrador" });
    }

    req.adminBDD = adminBDD;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

export default verificarAdmin;
