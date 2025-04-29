// Importar JWT y el Modelo
import jwt from "jsonwebtoken";
import Admin from "../models/administrador.js";
// Método para proteger rutas
const verificarAuthAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Si no hay token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token no proporcionado o con formato inválido" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const { id, rol } = jwt.verify(token, process.env.JWT_SECRET);

    if (rol !== "admin") {
      return res.status(403).json({ msg: "Acceso prohibido: No tienes permisos de administrador" });
    }

    const admin = await Admin.findById(id).select("-password");
    if (!admin) {
      return res.status(404).json({ msg: "Administrador no encontrado" });
    }

    req.adminBDD = admin;
    next();

  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

// Exportar el método
export default verificarAuthAdmin;
