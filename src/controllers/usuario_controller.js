import Usuario from "../models/usuarios.js";
import generarJWT from "../T_helpers/crearJWT.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

// Registrar usuario
const registerUser = async (req, res) => {
    const { nombre, apellido, genero, email, password } = req.body;

    // Verificar que no haya campos vacíos
    if (!nombre || !apellido || !genero || !email || !password) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    // Verificar si el email ya está registrado
    const verificarEmailBDD = await Usuario.findOne({ email });

    if (verificarEmailBDD) {
        return res.status(400).json({ msg: "El email ya se encuentra registrado" });
    }

    try {
        // Crear nuevo usuario con todos los campos
        const nuevoUsuario = new Usuario({ nombre, apellido, genero, email, password });

        // Encriptar la contraseña
        nuevoUsuario.password = await nuevoUsuario.encryptPassword(password);
        const token = nuevoUsuario.crearToken()
        await sendMailToUser(email,token)
        await nuevoUsuario.save();
        res.status(200).json({msg:"Revisa tu correo electrónico para confirmar tu cuenta"})

        // Excluir la contraseña antes de enviar la respuesta
        const { password: _, ...usuarioSinPassword } = nuevoUsuario.toObject();

        res.status(200).json({ msg: "Registro exitoso, ya puedes hacer login", usuario: usuarioSinPassword });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al registrar el usuario" });
    }
};

//  Verificar correo de confirmación
const confirmarEmail = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ msg: "Token no proporcionado" });
    }

    try {
        const usuario = await Usuario.findOne({ token });

        if (!usuario) {
            return res.status(404).json({ msg: "Token inválido o expirado" });
        }

        usuario.confirmado = true;
        usuario.token = null; // Limpiar el token
        await usuario.save();

        res.status(200).json({ msg: "Correo confirmado exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al confirmar el correo" });
    }
}

// Iniciar sesión
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (Object.values(req.body).includes("")) {
        return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    const UsuarioBDD = await Usuario.findOne({ email });

    if (!UsuarioBDD || !(await UsuarioBDD.matchPassword(password))) {
        return res.status(401).json({ msg: "Credenciales inválidas" });
    }

    const verificarPassword = await UsuarioBDD.matchPassword(password);

    if (!verificarPassword) {
        return res.status(404).json({ msg: "Usuario o contraseña incorrectos." });
    }

    const token = generarJWT(UsuarioBDD._id, "usuario");

    const { nombre, apellido, genero, rol, _id } = UsuarioBDD;

    res.status(200).json({
        token,
        nombre,
        apellido,
        genero,
        rol,
        email: UsuarioBDD.email,
        _id,
    });
};

// Modificar perfil de usuario
const updateUserProfile = async (req, res) => {
    const id = req.UsuarioBDD._id; // ID autenticado
    const { nombre, apellido, genero, email } = req.body;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: "No hay datos para actualizar" });
    }

    try {
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        if (email && email !== usuario.email) {
            const emailExistente = await Usuario.findOne({ email });
            if (emailExistente) {
                return res.status(400).json({ msg: "El email ya está en uso" });
            }
        }

        usuario.nombre = nombre ?? usuario.nombre;
        usuario.apellido = apellido ?? usuario.apellido;
        usuario.genero = genero ?? usuario.genero;
        usuario.email = email ?? usuario.email;

        await usuario.save();

        res.status(200).json({ msg: "Perfil actualizado con éxito", usuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al actualizar el perfil" });
    }
};


// Recuperar contraseña (envía un código por email)
const recuperarContrasenia = async (req, res) => {
    const { email } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(404).json({ msg: "Correo no registrado" });
        }

        const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000);
        usuario.codigoRecuperacion = codigoRecuperacion;
        await usuario.save();

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
        const usuario = await Usuario.findOne({ email });

        if (!usuario || usuario.codigoRecuperacion !== codigoRecuperacion) {
            return res.status(400).json({ msg: "Código de recuperación incorrecto" });
        }

        usuario.password = await bcrypt.hash(nuevaPassword, 10);
        usuario.codigoRecuperacion = null; 
        await usuario.save();

        res.json({ msg: "Contraseña cambiada con éxito" });
    } catch (error) {
        res.status(500).json({ msg: "Error al cambiar la contraseña" });
    }
};

export {
    registerUser,
    loginUser,
    updateUserProfile,
    recuperarContrasenia,
    cambiarContrasenia,
    confirmarEmail
};
