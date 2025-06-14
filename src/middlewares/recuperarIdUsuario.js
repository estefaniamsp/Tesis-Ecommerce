// Importar JWT y el Modelo
import jwt from "jsonwebtoken";
import Clientes from "../models/clientes.js";

const recuperarIdUsuario = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return next(); // No hay token, no pasa nada
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const cliente = await Clientes.findById(decoded.id);
    if (cliente) {
      req.clienteBDD = cliente;
    }
  } catch (error) {
    console.warn("Token de cliente inválido o expirado.");
  }

  return next();
};

export default recuperarIdUsuario;
