import Clientes from "../models/clientes.js";
import generarJWT from "../T_helpers/crearJWT.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { sendMailToUser } from "../config/nodemailer.js";
import e from "express";

// Registrar cliente
const registerCliente = async (req, res) => {
  let { nombre, apellido, genero, email, password } = req.body;

  // 🧹 Limpiar espacios
  nombre = nombre ? nombre.trim() : "";
  apellido = apellido ? apellido.trim() : "";
  genero = genero ? genero.trim() : "";
  email = email ? email.trim() : "";
  password = password ? password.trim() : "";

  // 📋 Validación de campos vacíos o solo espacios
  if (!nombre || !apellido || !genero || !email || !password) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  // 📋 Validar que el email sea formato correcto
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "El correo ingresado no es válido" });
  }

  // 📋 Verificar si el email ya existe
  const verificarEmailBDD = await Clientes.findOne({ email });
  if (verificarEmailBDD) {
    return res.status(400).json({ msg: "El email ya se encuentra registrado" });
  }

  try {
    // Crear cliente y encriptar contraseña
    const nuevoCliente = new Clientes({ nombre, apellido, genero, email, password });
    nuevoCliente.password = await nuevoCliente.encryptPassword(password);
    const token = nuevoCliente.crearToken();

    // ENVIAR CORREO ANTES DE GUARDAR
    try {
      await sendMailToUser(email, token);
    } catch (mailError) {
      console.error("Error al enviar el correo:", mailError.message);
      return res.status(500).json({ msg: "No se pudo enviar el correo de confirmación" });
    }

    // Guardar en base de datos solo si el correo fue enviado con éxito
    await nuevoCliente.save();

    const { password: _, ...clienteSinPassword } = nuevoCliente.toObject();

    return res.status(200).json({
      msg: "Revisa tu correo electrónico para confirmar tu cuenta",
      cliente: clienteSinPassword,
    });

  } catch (error) {
    console.error("Error al registrar el cliente:", error.message);
    return res.status(500).json({ msg: "Error al registrar el cliente" });
  }
};

//  Verificar correo de confirmación
const confirmEmail = async (req, res) => {
  const { token } = req.params;
  console.log(token);
  if (!token) {
    return res.status(400).json({ msg: "Token no proporcionado" });
  }

  try {
    const cliente = await Clientes.findOne({ token });

    if (!cliente) {
      return res.status(404).json({ msg: "Token inválido o expirado " + token });
    }

    cliente.confirmEmail = true;
    cliente.token = null; // Limpiar el token
    await cliente.save();

    res.status(200).json({ msg: "Correo confirmado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al confirmar el correo" });
  }
}

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
      return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    const verificarPassword = await ClienteBDD.matchPassword(password);

    if (!verificarPassword) {
      return res.status(401).json({ msg: "Credenciales inválidas" });
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


// Modificar perfil de cliente
const updateClienteProfile = async (req, res) => {
  try {
    let { _id } = req.clienteBDD;
    _id = _id.toString(); // Asegurar que sea string

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

    // 🧹 Limpiar espacios
    cedula = cedula?.trim();
    nombre = nombre?.trim();
    apellido = apellido?.trim();
    genero = genero?.trim();
    email = email?.trim();
    direccion = direccion?.trim();
    telefono = telefono?.trim();
    fecha_nacimiento = fecha_nacimiento?.trim();

    // 📋 Validaciones básicas
    if (!nombre || !apellido || !genero || !email) {
      return res.status(400).json({ msg: "Nombre, apellido, género y email son obligatorios" });
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      return res.status(400).json({ msg: "El nombre solo debe contener letras" });
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      return res.status(400).json({ msg: "El apellido solo debe contener letras" });
    }

    if (genero !== "masculino" && genero !== "femenino") {
      return res.status(400).json({ msg: "El género debe ser 'masculino' o 'femenino'" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "El correo ingresado no es válido" });
    }

    if (telefono && (!/^\d{10}$/.test(telefono))) {
      return res.status(400).json({ msg: "El teléfono debe tener exactamente 10 números" });
    }

    if (fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) {
      return res.status(400).json({ msg: "La fecha de nacimiento debe tener el formato YYYY-MM-DD" });
    }

    const cliente = await Clientes.findById(_id);
    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    if (email && email !== cliente.email) {
      const emailExistente = await Clientes.findOne({ email });
      if (emailExistente && emailExistente._id.toString() !== _id) {
        return res.status(400).json({ msg: "El email ya está en uso por otro cliente" });
      }
    }

    // ✅ Actualizar solo los campos enviados
    if (cedula) cliente.cedula = cedula;
    if (nombre) cliente.nombre = nombre;
    if (apellido) cliente.apellido = apellido;
    if (genero) cliente.genero = genero;
    if (email) cliente.email = email;
    if (direccion) cliente.direccion = direccion;
    if (telefono) cliente.telefono = telefono;
    if (fecha_nacimiento) cliente.fecha_nacimiento = fecha_nacimiento;

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
        fecha_nacimiento: cliente.fecha_nacimiento
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
    cliente.codigoRecuperacion = codigoRecuperacion;
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
      subject: "Código de recuperación de contraseña",
      text: `Tu código de recuperación es: ${codigoRecuperacion}`,
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

  // 🔥 Limpiar espacios
  email = email?.trim();
  nuevaPassword = nuevaPassword?.trim();

  // 🔥 Validar campos
  if (!email || !nuevaPassword || !codigoRecuperacion) {
    return res.status(400).json({ msg: "Todos los campos son obligatorios" });
  }

  try {
    const cliente = await Clientes.findOne({ email });

    if (!cliente) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }

    // Convertir codigoRecuperacion a número para comparar correctamente
    const codigoRecuperacionNumber = parseInt(codigoRecuperacion);

    if (!cliente.codigoRecuperacion || cliente.codigoRecuperacion !== codigoRecuperacionNumber) {
      return res.status(400).json({ msg: "Código de recuperación incorrecto" });
    }

    // Cambiar la contraseña
    cliente.password = await bcrypt.hash(nuevaPassword, 10);
    cliente.codigoRecuperacion = null; // Eliminar el código después de cambiar contraseña
    await cliente.save();

    res.json({ msg: "Contraseña cambiada con éxito" });

  } catch (error) {
    console.error(error);
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
      .select("-password -token -codigoRecuperacion")
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
    const cliente = await Clientes.findById(id).select("-password -token -codigoRecuperacion");

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
    const nuevoCliente = new Clientes({ nombre, apellido, genero, email, password, confirmEmail: true });
    nuevoCliente.password = await nuevoCliente.encryptPassword(password);
    const token = nuevoCliente.crearToken();

    try {
      await sendMailToUser(email, token);
    } catch (mailError) {
      console.error("Error al enviar el correo:", mailError.message);
      return res.status(500).json({ msg: "No se pudo enviar el correo de confirmación" });
    }

    // Guardar en base de datos solo si el correo fue enviado con éxito
    await nuevoCliente.save();

    const { password: _, ...clienteSinPassword } = nuevoCliente.toObject();

    return res.status(200).json({
      msg: "Solicita al cliente revisar su correo electrónico para confirmar su cuenta",
      cliente: clienteSinPassword,
    });

  } catch (error) {
    res.status(500).json({ msg: "Error al crear cliente", error: error.message });
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
      return res.status(404).json({ msg: "Cliente no encontrado" });
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
