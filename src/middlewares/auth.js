// Importar JWT y el Modelo
import jwt from "jsonwebtoken";
import Clientes from "../models/clientes.js";
import Admin from "../models/administrador.js";
// Método para proteger rutas
const verificarAutenticacion = async (req, res, next) => {
  // Validación si se está enviando el token
  if (!req.headers.authorization) return res.status(404).json({ msg: "Lo sentimos, debes proprocionar un token" });
  try {
    const { id } = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    req.clienteBDD = await Clientes.findById(id).select("-password");
    if (req.clienteBDD) next();
    req.adminBDD = await Admin.findById(id).select("-password");
    if (req.adminBDD) next();
    return res.status(404).json({ msg: "Lo sentimos, no tienes permisos para acceder a esta ruta" });
    
  } catch (error) {
    const e = new Error("Formato del token no válido")
    return res.status(404).json({ msg: e.message }) 
  }
}

// Exportar el método
export default verificarAutenticacion;
