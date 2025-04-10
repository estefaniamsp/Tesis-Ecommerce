import Clientes from "../models/clientes.js";
import generarJWT from "../T_helpers/crearJWT.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import sendMailToUser from "../config/nodemailer.js";

// Registrar cliente
const registerCliente = async (req, res) => {
    const { nombre, apellido, genero, email, password } = req.body;

    // Verificar que no haya campos vacíos
    if (!nombre || !apellido || !genero || !email || !password) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    // Verificar si el email ya está registrado
    const verificarEmailBDD = await Clientes.findOne({ email });

    if (verificarEmailBDD) {
        return res.status(400).json({ msg: "El email ya se encuentra registrado" });
    }

    try {
        // Crear nuevo cliente con todos los campos
        const nuevoCliente = new Clientes({ nombre, apellido, genero, email, password });

        // Encriptar la contraseña
        nuevoCliente.password = await nuevoCliente.encryptPassword(password);
        const token = nuevoCliente.crearToken()
        await sendMailToUser(email,token)
        await nuevoCliente.save();
        res.status(200).json({msg:"Revisa tu correo electrónico para confirmar tu cuenta"})

        // Excluir la contraseña antes de enviar la respuesta
        const { password: _, ...clienteSinPassword } = nuevoCliente.toObject();

        res.status(200).json({ msg: "Registro exitoso, ya puedes hacer login", cliente: clienteSinPassword });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al registrar el cliente" });
    }
};

//  Verificar correo de confirmación
const confirmEmail = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ msg: "Token no proporcionado" });
    }

    try {
        const cliente = await Clientes.findOne({ token });

        if (!cliente) {
            return res.status(404).json({ msg: "Token inválido o expirado" });
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
    const { email, password } = req.body;

    if (Object.values(req.body).includes("")) {
        return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    const ClienteBDD = await Clientes.findOne({ email });

    if (!ClienteBDD || !(await ClienteBDD.matchPassword(password))) {
        return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    const verificarPassword = await ClienteBDD.matchPassword(password);

    if (!verificarPassword) {
        return res.status(404).json({ msg: "Usuario o contraseña incorrectos." });
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
};

// Modificar perfil de cliente
const updateClienteProfile = async (req, res) => {
    const id = req.clienteBDD._id; // ID autenticado
    const { nombre, apellido, genero, email } = req.body;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "No hay datos para actualizar" });
    }

    try {
        const cliente = await Clientes.findById(id);
        if (!cliente) {
            return res.status(404).json({ msg: "Cliente no encontrado" });
        }

        if (email && email !== cliente.email) {
            const emailExistente = await Clientes.findOne({ email });
            if (emailExistente) {
                return res.status(400).json({ msg: "El email ya está en uso" });
            }
        }

        cliente.nombre = nombre ?? cliente.nombre;
        cliente.apellido = apellido ?? cliente.apellido;
        cliente.genero = genero ?? cliente.genero;
        cliente.email = email ?? cliente.email;

        await cliente.save();

        res.status(200).json({ msg: "Perfil actualizado con éxito", cliente: cliente });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar el perfil" });
    }
};


// Recuperar contraseña (envía un código por email)
const recuperarContrasenia = async (req, res) => {
    const { email } = req.body;

    try {
        const cliente = await Clientes.findOne({ email });

        if (!cliente) {
            return res.status(404).json({ msg: "Correo no registrado" });
        }

        const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000);
        cliente.codigoRecuperacion = codigoRecuperacion;
        await cliente.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Código de recuperación de contraseña",
            text: `Tu código de recuperación es: ${codigoRecuperacion}`,
        });

        res.json({ msg: "Código de recuperación enviado al correo" });
    } catch (error) {
        res.status(500).json({ msg: "Error al enviar el código de recuperación" });
    }
};

// Cambiar contraseña
const cambiarContrasenia = async (req, res) => {
    const { email, nuevaPassword, codigoRecuperacion } = req.body;

    try {
        const cliente = await Clientes.findOne({ email });

        if (!cliente || cliente.codigoRecuperacion !== codigoRecuperacion) {
            return res.status(400).json({ msg: "Código de recuperación incorrecto" });
        }

        cliente.password = await bcrypt.hash(nuevaPassword, 10);
        cliente.codigoRecuperacion = null; 
        await cliente.save();

        res.json({ msg: "Contraseña cambiada con éxito" });
    } catch (error) {
        res.status(500).json({ msg: "Error al cambiar la contraseña" });
    }
};

export {
    registerCliente,
    loginCliente,
    updateClienteProfile,
    recuperarContrasenia,
    cambiarContrasenia,
    confirmEmail
};
