import Clientes from "../models/clientes.js";
import generarJWT from "../T_helpers/crearJWT.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { sendMailToUser } from "../config/nodemailer.js";
import cloudinary from "../config/cloudinary.js";

// Registrar cliente
const registerCliente = async (req, res) => {
  let { nombre, apellido, genero, email, password } = req.body;

  nombre = nombre?.trim();
  apellido = apellido?.trim();
  genero = genero?.trim();
  email = email?.trim();
  password = password?.trim();

  if (!nombre || !apellido || !genero || !email || !password) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "El correo ingresado no es válido" });
  }

  const verificarEmailBDD = await Clientes.findOne({ email });
  if (verificarEmailBDD) {
    return res.status(400).json({ msg: "El email ya se encuentra registrado" });
  }

  try {
    // 1. Crear cliente sin token
    const nuevoCliente = new Clientes({
      nombre,
      apellido,
      genero,
      email,
      password: await bcrypt.hash(password, 10)
    });

    // 2. Guardar el cliente
    await nuevoCliente.save();

    // 3. Generar y asignar token
    const token = nuevoCliente.crearToken();
    nuevoCliente.token = token;
    await nuevoCliente.save(); // Guardar con token

    // 4. Enviar correo
    try {
      await sendMailToUser(email, token);
    } catch (mailError) {
      console.error("Error al enviar el correo:", mailError.message);
      return res.status(500).json({ msg: "Cliente creado, pero falló el envío del correo de confirmación" });
    }

    // 5. Respuesta sin campos sensibles
    const {
      password: _,
      token: __,
      codigoRecuperacion,
      codigoRecuperacionExpires,
      ...clienteSeguro
    } = nuevoCliente.toObject();

    return res.status(200).json({
      msg: "Revisa tu correo electrónico para confirmar tu cuenta",
      cliente: clienteSeguro
    });

  } catch (error) {
    console.error("Error al registrar el cliente:", error.message);
    return res.status(500).json({ msg: "Error al registrar el cliente" });
  }
};

//  Verificar correo de confirmación
const confirmEmail = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send("<h2>Token no proporcionado</h2>");
  }

  try {
    const cliente = await Clientes.findOne({ token });

    if (!cliente) {
      return res.status(404).send(`
        <div style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #c0392b;">Token inválido o expirado</h2>
          <p>Por favor solicita uno nuevo.</p>
        </div>
      `);
    }

    cliente.confirmEmail = true;
    cliente.token = null;
    await cliente.save();

    return res.status(200).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #27ae60;">¡Correo confirmado exitosamente!</h2>
        <p>Puedes cerrar esta ventana y continuar navegando en la aplicación.</p>
      </div>
    `);
  } catch (error) {
    console.error(error);
    return res.status(500).send(`
      <div style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #e74c3c;">Error al confirmar el correo</h2>
        <p>Intenta nuevamente más tarde.</p>
      </div>
    `);
  }
};

// Iniciar sesión
const loginCliente = async (req, res) => {
  let { email, password } = req.body;

  // 🧹 Limpiar espacios al inicio y final
  email = email ? email.trim() : "";
  password = password ? password.trim() : "";

  // 📋 Validaciones básicas
  if (!email && !password) {
    return res.status(400).json({ msg: "Debes ingresar el email y la contraseña" });
  }
  if (!email) {
    return res.status(400).json({ msg: "El campo 'email' es obligatorio" });
  }
  if (!password) {
    return res.status(400).json({ msg: "El campo 'password' es obligatorio" });
  }

  // 📋 Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "El correo ingresado no es válido" });
  }

  try {
    const ClienteBDD = await Clientes.findOne({ email });

    if (!ClienteBDD) {
      return res.status(401).json({ msg: "Correo o contraseña incorrectos" });
    }

    const verificarPassword = await ClienteBDD.matchPassword(password);

    if (!verificarPassword) {
      return res.status(401).json({ msg: "Correo o contraseña incorrectos" });
    }

    const token = generarJWT(ClienteBDD._id, ClienteBDD.nombre);
    const { nombre, apellido, genero, _id } = ClienteBDD;

    res.status(200).json({
      token,
      nombre,
      apellido,
      genero,
      email: ClienteBDD.email,
      _id,
    });
  } catch (error) {
    console.error("Error en loginCliente:", error.message);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// Actualizar perfil de cliente
const updateClienteProfile = async (req, res) => {
  try {
    let { _id } = req.clienteBDD;
    _id = _id.toString();

    let {
      cedula,
      nombre,
      apellido,
      genero,
      email,
      direccion,
      telefono,
      fecha_nacimiento
    } = req.body;

    // Limpiar espacios
    cedula = cedula?.trim();
    nombre = nombre?.trim();
    apellido = apellido?.trim();
    genero = genero?.trim();
    email = email?.trim();
    direccion = direccion?.trim();
    telefono = telefono?.trim();
    fecha_nacimiento = fecha_nacimiento?.trim();

    const cliente = await Clientes.findById(_id);
    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    // Validación de perfil incompleto
    const camposFaltantes = [];
    if (!cliente.nombre && !nombre) camposFaltantes.push("nombre");
    if (!cliente.apellido && !apellido) camposFaltantes.push("apellido");
    if (!cliente.genero && !genero) camposFaltantes.push("genero");
    if (!cliente.cedula && !cedula) camposFaltantes.push("cedula");
    if (!cliente.telefono && !telefono) camposFaltantes.push("telefono");
    if (!cliente.fecha_nacimiento && !fecha_nacimiento) camposFaltantes.push("fecha_nacimiento");

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        msg: "Debes completar tu perfil antes de editar individualmente.",
        campos_obligatorios: camposFaltantes
      });
    }

    // Validaciones básicas
    if (nombre && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      return res.status(400).json({ msg: "El nombre solo debe contener letras" });
    }

    if (apellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      return res.status(400).json({ msg: "El apellido solo debe contener letras" });
    }

    if (genero && genero !== "masculino" && genero !== "femenino") {
      return res.status(400).json({ msg: "El género debe ser 'masculino' o 'femenino'" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ msg: "El correo ingresado no es válido" });
    }

    if (telefono && !/^\d{10}$/.test(telefono)) {
      return res.status(400).json({ msg: "El teléfono debe tener exactamente 10 números" });
    }

    if (cedula && !/^\d{10}$/.test(cedula)) {
      return res.status(400).json({ msg: "La cédula debe tener exactamente 10 números" });
    }

    if (fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
      return res.status(400).json({ msg: "La fecha de nacimiento debe tener el formato YYYY-MM-DD" });
    }

    // Validación de duplicados
    if (email && email !== cliente.email) {
      const emailExistente = await Clientes.findOne({ email });
      if (emailExistente && emailExistente._id.toString() !== _id) {
        return res.status(400).json({ msg: "El email ya está en uso por otro cliente" });
      }
    }

    if (cedula && cedula !== cliente.cedula) {
      const cedulaExistente = await Clientes.findOne({ cedula });
      if (cedulaExistente && cedulaExistente._id.toString() !== _id) {
        return res.status(400).json({ msg: "La cédula ya está registrada por otro cliente" });
      }
    }

    if (telefono && telefono !== cliente.telefono) {
      const telefonoExistente = await Clientes.findOne({ telefono });
      if (telefonoExistente && telefonoExistente._id.toString() !== _id) {
        return res.status(400).json({ msg: "El teléfono ya está registrado por otro cliente" });
      }
    }

    // Actualizar campos enviados
    if (cedula) cliente.cedula = cedula;
    if (nombre) cliente.nombre = nombre;
    if (apellido) cliente.apellido = apellido;
    if (genero) cliente.genero = genero;
    if (email) cliente.email = email;
    if (direccion) cliente.direccion = direccion;
    if (telefono) cliente.telefono = telefono;
    if (fecha_nacimiento) cliente.fecha_nacimiento = fecha_nacimiento;

    // Imagen
    const imagenFile = req.file;
    if (imagenFile) {
      if (cliente.imagen_id) {
        try {
          await cloudinary.uploader.destroy(cliente.imagen_id);
        } catch (err) {
          console.error("Error al borrar imagen anterior:", err.message);
        }
      }

      cliente.imagen = imagenFile.path;
      cliente.imagen_id = imagenFile.filename;
    }

    await cliente.save();

    res.status(200).json({
      msg: "Perfil actualizado con éxito",
      cliente: {
        cedula: cliente.cedula,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        genero: cliente.genero,
        email: cliente.email,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        fecha_nacimiento: cliente.fecha_nacimiento,
        imagen: cliente.imagen
      }
    });

  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    if (!res.headersSent) {
      return res.status(500).json({ msg: "Error del servidor al actualizar el perfil" });
    }
  }
};


// Recuperar contraseña (envía un código por email)
const recuperarContrasenia = async (req, res) => {
  const { email } = req.body;

  try {
    const cliente = await Clientes.findOne({ email });
    console.log("Cliente encontrado:", cliente);

    if (!cliente) {
      return res.status(404).json({ msg: "Correo no registrado" });
    }

    const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000);
    cliente.codigoRecuperacion = codigoRecuperacion.toString();
    cliente.codigoRecuperacionExpires = Date.now() + 10 * 60 * 1000; // ⏳ 10 minutos

    await cliente.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
      },
    });

    await transporter.sendMail({
      from: process.env.USER_MAILTRAP,
      to: email,
      subject: "🔐 Código de recuperación de contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Recuperación de contraseña</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Usa el siguiente código para continuar con el proceso:</p>
          <div style="font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; color: #1abc9c;">
            ${codigoRecuperacion}
          </div>
          <p>Este código es válido por 10 minutos.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #888;">Este mensaje fue generado automáticamente, no respondas a este correo.</p>
        </div>
      `
    });

    res.json({ msg: "Código de recuperación enviado al correo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al enviar el código de recuperación" });
  }
};


// Cambiar contraseña
const cambiarContrasenia = async (req, res) => {
  let { email, nuevaPassword, codigoRecuperacion } = req.body;

  // Limpiar
  email = email?.trim().toLowerCase();
  nuevaPassword = nuevaPassword?.trim();
  codigoRecuperacion = codigoRecuperacion?.toString().trim();

  // Validaciones básicas
  if (!email || !nuevaPassword || !codigoRecuperacion) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  try {
    const cliente = await Clientes.findOne({ email });

    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    const codigoGuardado = cliente.codigoRecuperacion?.toString().trim();
    const ahora = Date.now();

    console.log(">> código recibido:", codigoRecuperacion);
    console.log(">> código guardado:", codigoGuardado);
    console.log(">> expira en:", new Date(cliente.codigoRecuperacionExpires));
    console.log(">> ahora es:", new Date());

    // Validación del código
    if (
      !/^\d{6}$/.test(codigoRecuperacion) ||
      !codigoGuardado ||
      codigoRecuperacion !== codigoGuardado ||
      !cliente.codigoRecuperacionExpires ||
      cliente.codigoRecuperacionExpires < ahora
    ) {
      return res.status(400).json({ msg: "Código de recuperación inválido o expirado" });
    }

    // Cambiar contraseña
    const salt = await bcrypt.genSalt(10);
    cliente.password = await bcrypt.hash(nuevaPassword, salt);

    // Limpiar código usado
    cliente.codigoRecuperacion = null;
    cliente.codigoRecuperacionExpires = null;

    await cliente.save();

    res.json({ msg: "Contraseña cambiada con éxito" });

  } catch (error) {
    console.error("Error al cambiar la contraseña del cliente:", error);
    res.status(500).json({ msg: "Error al cambiar la contraseña" });
  }
};

const getAllClientes = async (req, res) => {
  try {
    // Extraer y convertir los parámetros de consulta
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    // Validar que 'page' y 'limit' sean números enteros positivos
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    // Obtener los clientes con paginación
    const clientes = await Clientes.find()
      .select("-password -token -codigoRecuperacion -codigoRecuperacionExpires")
      .skip(skip)
      .limit(limit);

    // Contar el total de clientes
    const totalClientes = await Clientes.countDocuments();

    // Calcular el total de páginas
    const totalPaginas = Math.ceil(totalClientes / limit);

    // Verificar si se encontraron clientes
    if (clientes.length === 0) {
      return res.status(404).json({ msg: "No se encontraron clientes" });
    }

    // Responder con los clientes y la información de paginación
    return res.status(200).json({
      totalClientes,
      totalPaginas,
      paginaActual: page,
      clientes
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return res.status(500).json({ msg: "Error al obtener los clientes", error: error.message });
  }
};

const getClienteById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID inválido" });
  }

  try {
    const cliente = await Clientes.findById(id).select("-password -token -codigoRecuperacion -codigoRecuperacionExpires");

    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    res.status(200).json(cliente);
  } catch (error) {
    res.status(500).json({ msg: "Error al buscar el cliente", error: error.message });
  }
};

const createClienteAdmin = async (req, res) => {
  const { nombre, apellido, genero, email, password } = req.body;

  if (!nombre || !apellido || !genero || !email || !password) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  const existe = await Clientes.findOne({ email });
  if (existe) {
    return res.status(400).json({ msg: "Este email ya está registrado" });
  }

  try {
    // 1. Crear cliente sin token
    const nuevoCliente = new Clientes({
      nombre,
      apellido,
      genero,
      email,
      password: await bcrypt.hash(password, 10),
      confirmEmail: true // Si quieres que se confirme automáticamente desde admin
    });

    await nuevoCliente.save();

    // 2. Generar token y asignarlo
    const token = nuevoCliente.crearToken();
    nuevoCliente.token = token;
    await nuevoCliente.save();

    // 3. Enviar correo de confirmación
    try {
      await sendMailToUser(email, token);
    } catch (mailError) {
      console.error("Error al enviar el correo:", mailError.message);
      return res.status(500).json({ msg: "Cliente creado, pero falló el envío del correo de confirmación" });
    }

    // 4. Retornar cliente sin datos sensibles
    const {
      password: _,
      token: __,
      codigoRecuperacion,
      codigoRecuperacionExpires,
      ...clienteSeguro
    } = nuevoCliente.toObject();

    return res.status(200).json({
      msg: "Solicita al cliente revisar su correo electrónico para confirmar su cuenta",
      cliente: clienteSeguro
    });

  } catch (error) {
    console.error("Error al crear cliente:", error.message);
    return res.status(500).json({ msg: "Error al crear cliente", error: error.message });
  }
};

const updateClienteAdmin = async (req, res) => {
  const { id } = req.params;
  const camposPermitidos = [
    "cedula", "nombre", "apellido", "genero", "email",
    "direccion", "telefono", "fecha_nacimiento"
  ];
  const datos = req.body;

  try {
    const cliente = await Clientes.findById(id);
    if (!cliente) return res.status(404).json({ msg: "Cliente no encontrado" });

    // Reemplazar imagen si se subió una nueva
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (cliente.imagen_id) {
        try {
          await cloudinary.uploader.destroy(cliente.imagen_id);
        } catch (error) {
          console.warn("No se pudo eliminar la imagen anterior en Cloudinary:", error.message);
        }
      }

      // Guardar nueva imagen
      cliente.imagen = req.file.path;
      cliente.imagen_id = req.file.filename;
    }

    // Actualizar los demás campos permitidos
    camposPermitidos.forEach(campo => {
      if (datos[campo] !== undefined) cliente[campo] = datos[campo];
    });

    await cliente.save();
    res.status(200).json({ msg: "Cliente actualizado correctamente" });

  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar cliente", error: error.message });
  }
};

const deleteClienteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await Clientes.findByIdAndDelete(id);

    if (!cliente) {
      try {
        await cloudinary.uploader.destroy(cliente.imagen_id);
      } catch (error) {
        console.warn("No se pudo eliminar la imagen en Cloudinary:", error.message);
      }
    }

    res.status(200).json({ msg: "Cliente eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar cliente", error: error.message });
  }
};

export {
  registerCliente,
  loginCliente,
  updateClienteProfile,
  recuperarContrasenia,
  cambiarContrasenia,
  confirmEmail,

  getAllClientes,
  getClienteById,
  createClienteAdmin,
  updateClienteAdmin,
  deleteClienteAdmin
};
