import { loginCliente} from './cliente_controller.js';
import { loginAdmin } from './admin_controller.js';
import Clientes from '../models/clientes.js';
import Admin from '../models/administrador.js';

// Este controlador intenta loguear como cliente primero, luego como admin
const loginInteligente = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Intenta login como cliente
    const ClienteBDD = await Clientes.findOne({ email });
    if (ClienteBDD) return loginCliente(req, res); 

    // Si no existe el cliente, intenta login como admin
    const admin = await Admin.findOne({ email });
    if (admin) return loginAdmin(req, res);

    // Si ninguno fue válido
    return res.status(401).json({ msg: "Credenciales inválidas" });

  } catch (error) {
    console.error("Error en loginInteligente:", error);
    return res.status(500).json({ msg: "Error interno del servidor" });
  }
};

export { loginInteligente };

