import Clientes from "../models/clientes.js";
import generarJWT from "../T_helpers/crearJWT.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { sendMailToUser } from "../config/nodemailer.js";
import e from "express";

// Registrar cliente
const registerCliente = async (req, res) => {
    const { nombre, apellido, genero, email, password } = req.body;

    // Validación básica
    if (!nombre || !apellido || !genero || !email || !password) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

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
    let { _id } = req.clienteBDD;
    _id = _id.toString(); // Convertir a string para evitar problemas de comparación
    const {
        cedula,
        nombre,
        apellido,
        genero,
        email,
        direccion,
        telefono,
        fecha_nacimiento
    } = req.body;

    try {
        const cliente = await Clientes.findById(_id);
        if (!cliente) {
            res.status(404).json({ msg: "Cliente no encontrado" });
        }

        if (email && email !== cliente.email) {
            const emailExistente = await Clientes.findOne({ email });
            if (emailExistente && emailExistente._id.toString() !== _id.toString()) {
                res.status(400).json({ msg: "El email ya está en uso por otro cliente" });
            }
        }

        // Actualización segura campo por campo
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
            msg: "Perfil actualizado con éxito", cliente: {
                cedula: cliente.cedula,
                nombre: cliente.nombre,
                apellido: cliente.apellido,
                genero: cliente.genero,
                email: cliente.email,
                direccion: cliente.direccion,
                telefono: cliente.telefono,
                fecha_nacimiento: cliente.fecha_nacimiento
            }
        })

    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        if (!res.headersSent) {
            res.status(500).json({ msg: "Error del servidor al actualizar el perfil" });
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
