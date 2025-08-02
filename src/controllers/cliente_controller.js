import Clientes from "../models/clientes.js";
import Admin from "../models/administrador.js";
import Carrito from "../models/carritos.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { sendMailToUser } from "../config/nodemailer.js";
import { generarJWT, generarJWTSinCaducidad } from "../T_helpers/crearJWT.js";
import cloudinary from "../config/cloudinary.js";

// Registrar cliente
const registerCliente = async (req, res) => {
  let { nombre, apellido, genero, email, password, fecha_nacimiento } = req.body;

  nombre = nombre?.trim();
  apellido = apellido?.trim();
  genero = genero?.trim();
  email = email?.trim().toLowerCase();
  password = password?.trim();
  fecha_nacimiento = fecha_nacimiento?.trim();

  if (!nombre || !apellido || !genero || !email || !password || !fecha_nacimiento) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "El correo ingresado no es válido" });
  }

  const fechaNacimientoDate = new Date(fecha_nacimiento);
  const hoy = new Date();
  if (isNaN(fechaNacimientoDate.getTime())) {
    return res.status(400).json({ msg: "La fecha de nacimiento no es válida" });
  }
  if (fechaNacimientoDate >= hoy) {
    return res.status(400).json({ msg: "La fecha de nacimiento no puede ser futura" });
  }
  let edad = hoy.getFullYear() - fechaNacimientoDate.getFullYear();
  const mes = hoy.getMonth() - fechaNacimientoDate.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimientoDate.getDate())) {
    edad--;
  }
  if (edad < 18) {
    return res.status(400).json({ msg: "Debes tener al menos 18 años para registrarte" });
  }

  const verificarEmailBDD = await Clientes.findOne({ email });
  if (verificarEmailBDD) {
    return res.status(400).json({ msg: "Este correo ya está registrado" });
  }

  const verificarEmailBDDAdmin = await Admin.findOne({ email });
  if (verificarEmailBDDAdmin) {
    return res.status(400).json({ msg: "Este correo ya está registrado" });
  }

  try {
    const nuevoCliente = new Clientes({
      nombre,
      apellido,
      genero,
      email,
      fecha_nacimiento: fechaNacimientoDate,
      password: await bcrypt.hash(password, 10)
    });

    await nuevoCliente.save();

    const nuevoCarrito = new Carrito({
      cliente_id: nuevoCliente._id,
      productos: [],
      total: 0,
      estado: "pendiente",
    });
    await nuevoCarrito.save();

    const token = nuevoCliente.crearToken();
    nuevoCliente.token = token;
    await nuevoCliente.save();

    try {
      await sendMailToUser(email, token);
    } catch (mailError) {
      console.error("Error al enviar el correo:", mailError.message);
      return res.status(500).json({ msg: "Cliente creado, pero falló el envío del correo de confirmación" });
    }

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
  let { environment } = req.query;
  const WEB = "web";
  const MOBILE = "mobile";

  // Limpiar espacios al inicio y final
  email = email ? email.trim() : "";
  password = password ? password.trim() : "";
  environment = environment ? environment : WEB;

  // Validaciones básicas
  if (!email && !password) {
    return res.status(400).json({ msg: "Debes ingresar el email y la contraseña" });
  }
  if (!email) {
    return res.status(400).json({ msg: "El campo 'email' es obligatorio" });
  }
  if (!password) {
    return res.status(400).json({ msg: "El campo 'password' es obligatorio" });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "El correo ingresado no es válido" });
  }

  try {
    const ClienteBDD = await Clientes.findOne({ email });

    if (!ClienteBDD) {
      return res.status(401).json({ msg: "Correo o contraseña incorrectos" });
    }

    if (ClienteBDD.estado === "inactivo") {
      return res.status(401).json({ msg: "Tu cuenta ha sido desactivada" });
    }

    if (!ClienteBDD.confirmEmail) {
      return res.status(401).json({ msg: "Debes confirmar tu correo electrónico" });
    }

    const verificarPassword = await ClienteBDD.matchPassword(password);

    if (!verificarPassword) {
      return res.status(401).json({ msg: "Correo o contraseña incorrectos" });
    }

    let token;
    if (environment === WEB) {
      token = generarJWT(ClienteBDD._id, ClienteBDD.nombre)
    } else if (environment === MOBILE) {
      token = generarJWTSinCaducidad(ClienteBDD._id, ClienteBDD.nombre);
    } else {
      return res.status(400).json({ msg: "Entorno no válido" });
    }

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
    const clienteId = req.clienteBDD._id.toString();
    const body = req.body;

    const campos = {
      cedula: body.cedula?.trim(),
      nombre: body.nombre?.trim(),
      apellido: body.apellido?.trim(),
      genero: body.genero?.trim(),
      direccion: body.direccion?.trim(),
      telefono: body.telefono?.trim(),
      fecha_nacimiento: body.fecha_nacimiento?.trim()
    };

    const esValorValido = (valor) =>
      typeof valor === "string" && valor.trim() !== "";

    const cliente = await Clientes.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    const camposValidos = Object.entries(campos).filter(
      ([, value]) => esValorValido(value)
    );

    if (camposValidos.length === 0 && !req.file) {
      return res.status(400).json({
        msg: "No se envió ningún campo válido para actualizar."
      });
    }

    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (esValorValido(campos.nombre) && !regexNombre.test(campos.nombre)) {
      return res.status(400).json({ msg: "El nombre solo debe contener letras" });
    }
    if (esValorValido(campos.apellido) && !regexNombre.test(campos.apellido)) {
      return res.status(400).json({ msg: "El apellido solo debe contener letras" });
    }
    if (esValorValido(campos.genero) && !["masculino", "femenino"].includes(campos.genero)) {
      return res.status(400).json({ msg: "El género debe ser 'masculino' o 'femenino'" });
    }
    if (esValorValido(campos.telefono) && !/^\d{10}$/.test(campos.telefono)) {
      return res.status(400).json({ msg: "El teléfono debe tener exactamente 10 números" });
    }
    if (esValorValido(campos.cedula) && !/^\d{10}$/.test(campos.cedula)) {
      return res.status(400).json({ msg: "La cédula debe tener exactamente 10 números" });
    }
    if (campos.fecha_nacimiento) {
      const fechaNacimiento = new Date(campos.fecha_nacimiento);
      const hoy = new Date();
      if (fechaNacimiento >= hoy) {
        return res.status(400).json({ msg: "La fecha de nacimiento no puede ser futura" });
      }

      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const mes = hoy.getMonth() - fechaNacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }
      if (edad < 18) {
        return res.status(400).json({ msg: "Debes tener al menos 18 años para registrarte" });
      }
    }

    const camposUnicos = ["cedula", "telefono"];
    for (let [campo, valor] of camposValidos) {
      if (valor !== cliente[campo] && camposUnicos.includes(campo)) {
        const existe = await Clientes.findOne({ [campo]: valor });
        if (existe && existe._id.toString() !== clienteId) {
          return res.status(400).json({ msg: `El ${campo} ya está registrado por otro cliente` });
        }
      }
    }

    camposValidos.forEach(([key, value]) => {
      cliente[key] = value;
    });

    if (req.file) {
      try {
        if (cliente.imagen_id) {
          await cloudinary.uploader.destroy(cliente.imagen_id);
        }
        cliente.imagen = req.file.path;
        cliente.imagen_id = req.file.filename;
      } catch (err) {
        console.warn("Error al actualizar imagen en Cloudinary:", err.message);
      }
    }

    await cliente.save();

    return res.status(200).json({
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
    console.error("Error al actualizar perfil:", error);
    if (!res.headersSent) {
      res.status(500).json({ msg: "Error del servidor al actualizar el perfil" });
    }
  }
};

// Obtener perfil de cliente
const getClienteProfile = async (req, res) => {
  try {
    const clienteId = req.clienteBDD._id.toString();

    const cliente = await Clientes.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    return res.status(200).json({
      msg: "Perfil obtenido correctamente",
      cliente: {
        cedula: cliente.cedula,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        genero: cliente.genero,
        email: cliente.email,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        fecha_nacimiento: cliente.fecha_nacimiento,
        imagen: cliente.imagen,
        notificationPushToken: cliente.notificationPushToken || null
      }
    });

  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ msg: "Error del servidor al obtener el perfil" });
  }
};

// Recuperar contraseña (envía un código por email)
const recuperarContrasenia = async (req, res) => {
  try {
    // 1. Validar y limpiar entrada
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "El correo electrónico es obligatorio" });
    }
    email = email.trim().toLowerCase();

    // 2. Buscar cliente
    const cliente = await Clientes.findOne({ email });
    if (!cliente) {
      return res.status(404).json({ msg: "El correo no está registrado" });
    }

    // 3. Generar código y guardar
    const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000).toString();
    const duracionEnMinutos = 4;
    const tiempoExpiracion = Date.now() + duracionEnMinutos * 60 * 1000;

    cliente.codigoRecuperacion = codigoRecuperacion;
    cliente.codigoRecuperacionExpires = tiempoExpiracion;
    await cliente.save();

    // 4. Configurar y enviar correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
      },
    });

    const info = await transporter.sendMail({
      from: `"Soporte E-commerce Artesanal" <${process.env.USER_MAILTRAP}>`,
      to: email,
      subject: "Código de recuperación de contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Recuperación de contraseña</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Usa el siguiente código para continuar con el proceso:</p>
          <div style="font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; color: #1abc9c;">
            ${codigoRecuperacion}
          </div>
          <p>Este código es válido por ${duracionEnMinutos} minutos.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #888;">Este mensaje fue generado automáticamente, no respondas a este correo.</p>
        </div>
      `,
    });

    console.log("Código enviado:", info.messageId);

    res.status(200).json({ msg: "El código de recuperación ha sido enviado a tu correo" });

  } catch (error) {
    console.error("Error al recuperar contraseña:", error);
    res.status(500).json({
      msg: "Ocurrió un error al intentar enviar el código de recuperación",
      error: error.message,
    });
  }
};

// Cambiar contraseña
const cambiarContrasenia = async (req, res) => {
  let { email, nuevaPassword } = req.body;
  let { codigoRecuperacion } = req.query;

  // Limpiar
  email = email?.trim().toLowerCase();
  nuevaPassword = nuevaPassword?.trim();
  codigoRecuperacion = codigoRecuperacion?.toString().trim();

  // Validaciones básicas
  if (!email || !nuevaPassword || !codigoRecuperacion) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  if (!/^\d{6}$/.test(codigoRecuperacion)) {
    return res.status(400).json({ msg: "El código de recuperación debe tener exactamente 6 dígitos numéricos" });
  }

  try {
    const cliente = await Clientes.findOne({ email });

    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado con ese correo" });
    }

    const codigoGuardado = cliente.codigoRecuperacion?.toString().trim();
    const ahora = Date.now();

    // Validación del código
    if (!codigoGuardado) {
      return res.status(400).json({ msg: "No se ha generado ningún código de recuperación para este cliente" });
    }

    if (codigoRecuperacion !== codigoGuardado) {
      return res.status(400).json({ msg: "El código ingresado no coincide con el registrado" });
    }

    if (!cliente.codigoRecuperacionExpires || cliente.codigoRecuperacionExpires < ahora) {
      return res.status(400).json({ msg: "El código de recuperación ha expirado, solicita uno nuevo" });
    }

    // Cambiar contraseña
    const salt = await bcrypt.genSalt(10);
    cliente.password = await bcrypt.hash(nuevaPassword, salt);

    // Limpiar código usado
    cliente.codigoRecuperacion = null;
    cliente.codigoRecuperacionExpires = null;

    await cliente.save();

    res.json({ msg: "Contraseña cambiada con éxito. Ya puedes iniciar sesión." });

  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    res.status(500).json({ msg: "Error al cambiar la contraseña", error: error.message });
  }
};

const getAllClientes = async (req, res) => {
  try {
    // Extraer y convertir los parámetros de consulta
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    // Validar que 'page' y 'limit' sean números enteros positivos
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

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
      return res.status(404).json({ msg: "No se encontraron clientes en la base de datos.", paginaConsultada: page });
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
    return res.status(500).json({ msg: "Error al obtener la lista de los clientes", error: error.message });
  }
};

const getClienteById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      msg: "El ID proporcionado no es válido. Verifica el formato del identificador.",
      id_recibido: id
    });
  }

  try {
    const cliente = await Clientes.findById(id).select("-password -token -codigoRecuperacion -codigoRecuperacionExpires");

    if (!cliente) {
      return res.status(404).json({ msg: "No se encontró ningún cliente con el ID proporcionado.", id });
    }

    res.status(200).json({ msg: "Cliente encontrado exitosamente", cliente });
  } catch (error) {
    console.error(`Error al buscar cliente con ID ${id}:`, error);
    res.status(500).json({ msg: "Ocurrió un error al buscar el cliente.", error: error.message });
  }
};

const desactiveClienteAdmin = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID de cliente no válido" });
  }

  try {
    const cliente = await Clientes.findById(id);
    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    if (cliente.estado === 'inactivo') {
      return res.status(400).json({ error: `El cliente '${cliente.nombre} ${cliente.apellido}' ya está inactivo` });
    }

    await Clientes.findByIdAndUpdate(id, { estado: 'inactivo' });

    res.status(200).json({ msg: `Estado del cliente '${cliente.nombre} ${cliente.apellido}' actualizado a inactivo exitosamente` });

  } catch (error) {
    console.error("Error en desactiveClienteAdmin:", error);
    res.status(500).json({ error: "Error al actualizar el estado del cliente", detalle: error.message });
  }
};

const activeClienteAdmin = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID de cliente no válido" });
  }

  try {
    const cliente = await Clientes.findById(id);
    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    if (cliente.estado === 'activo') {
      return res.status(400).json({ error: `El cliente '${cliente.nombre} ${cliente.apellido}' ya está activo` });
    }

    await Clientes.findByIdAndUpdate(id, { estado: 'activo' });

    res.status(200).json({ msg: `Estado del cliente '${cliente.nombre} ${cliente.apellido}' actualizado a activo exitosamente` });
  } catch (error) {
    console.error("Error en activeClienteAdmin:", error);
    res.status(500).json({ error: "Error al actualizar el estado del cliente", detalle: error.message });
  }
};

export {
  registerCliente,
  loginCliente,
  updateClienteProfile,
  getClienteProfile,
  recuperarContrasenia,
  cambiarContrasenia,
  confirmEmail,

  getAllClientes,
  getClienteById,
  desactiveClienteAdmin,
  activeClienteAdmin
};
