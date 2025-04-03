// Importar JWT y el Modelo
import jwt from "jsonwebtoken";
import Usuarios from "../models/usuarios.js";
import Admin from "../models/administrador.js";
// Método para proteger rutas
const verificarAutenticacion = async (req, res, next) => {
  // Validación si se está enviando el token
  if (!req.headers.authorization) return res.status(404).json({ msg: "Lo sentimos, debes proprocionar un token" });
  try {
    const { id, rol } = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    if (rol === "admin")
      req.adminBDD = await Admin.findById(id).select("-password");
    else if (rol === "usuario")
      req.usuarioBDD = await Usuarios.findById(id).select("-password");
    next();
  } catch (error) {
    const e = new Error("Formato del token no válido")
    return res.status(404).json({ msg: e.message }) 
  }
}

// Exportar el método
export default verificarAutenticacion;
