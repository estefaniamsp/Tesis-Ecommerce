import Usuario from "../models/usuarios.js";
import generarJWT from "../T_helpers/crearJWT.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

// Registrar usuario
const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (Object.values(req.body).includes("")) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    const verificarEmailBDD = await Usuario.findOne({ email });

    if (verificarEmailBDD) {
        return res.status(400).json({ msg: "Lo sentimos, el email ya se encuentra registrado" });
    }

    const nuevoUsuario = new Usuario(req.body);
    nuevoUsuario.password = await nuevoUsuario.encrypPassword(password);
    await nuevoUsuario.save();
    delete nuevoUsuario.password;

    res.status(200).json({ msg: "Registro exitoso, ya puedes hacer login" });
};

// Iniciar sesión
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (Object.values(req.body).includes("")) {
        return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    const UsuarioBDD = await Usuario.findOne({ email });

    if (!UsuarioBDD) {
        return res.status(404).json({ msg: "Usuario o contraseña incorrectos." });
    }

    const verificarPassword = await UsuarioBDD.matchPassword(password);

    if (!verificarPassword) {
        return res.status(404).json({ msg: "Usuario o contraseña incorrectos." });
    }

    const token = generarJWT(UsuarioBDD._id, UsuarioBDD.nombre);

    const { nombre, apellido, _id } = UsuarioBDD;

    res.status(200).json({
        token,
        nombre,
        apellido,
        email: UsuarioBDD.email,
        _id,
    });
};

// Modificar perfil de usuario
const updateUserProfile = async (req, res) => {
    const id = req.UsuarioBDD._id; // ID autenticado
    const { nombre, apellido, email } = req.body;

    if (!nombre && !apellido && !email) {
        return res.status(400).json({ msg: "Debes enviar al menos un campo para actualizar" });
    }

    try {
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        if (email && email !== usuario.email) {
            const emailExistente = await Usuario.findOne({ email });
            if (emailExistente) {
                return res.status(400).json({ msg: "El email ya está registrado con otro usuario" });
            }
        }

        usuario.nombre = nombre ?? usuario.nombre;
        usuario.apellido = apellido ?? usuario.apellido;
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
    const { email, nuevaPassword } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaPassword, salt);
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
    cambiarContrasenia
};
