// Importar JWT y el Modelo
import jwt from "jsonwebtoken";
import Admin from "../models/administrador.js";
// Método para proteger rutas
const verificarAuthAdmin = async (req, res, next) => {
  // Validación si se está enviando el token
  if (!req.headers.authorization) return res.status(404).json({ msg: "Lo sentimos, debes proporcionar un token" });

  try {
    // Extraer el token (sin "Bearer")
    const token = req.headers.authorization.split(" ")[1];

    // Verificar y decodificar el token 
    const { id, rol } = jwt.verify(token, process.env.JWT_SECRET);

    // Validar que el rol sea "admin"
    if (rol !== "admin") {
      return res.status(403).json({ msg: "Acceso prohibido: No tienes permisos de administrador" });
    }

    // Encontrar al administrador en la base de datos
    req.adminBDD = await Admin.findById(id).select("-password");

    if (!req.adminBDD) return res.status(404).json({ msg: "Administrador no encontrado" });

    // Si todo es correcto, continuar con la siguiente acción
    return next();
  } catch (error) {
    console.error("Error en token:", error.message);
    return res.status(401).json({ msg: "Token inválido o expirado" });
  }
};

// Exportar el método
export default verificarAuthAdmin;
