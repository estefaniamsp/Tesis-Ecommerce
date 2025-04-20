import Admin from "../models/administrador.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import {sendMailToUserAdmin} from "../config/nodemailer.js";

const createAdmin = async () => {
    const email = "estefi2000ms2@gmail.com";
    const password = "admin1234";

    // Verificar que no haya campos vacíos
    if (!email || !password) {
        console.log("Todos los campos son obligatorios");
        return;
    }

    // Verificar si el email ya está registrado
    const verificarEmailBDD = await Admin.findOne({ email });

    if (verificarEmailBDD) {
        console.log("El email ya se encuentra registrado");
        return;
    }

    try {
        // Crear nuevo administrador con todos los campos
        const nuevoAdmin = new Admin({ email, password });

        // Encriptar la contraseña
        nuevoAdmin.password = await nuevoAdmin.encryptPassword(password);

        // Generar un token para la confirmación del email (si no está ya)
        const token = jwt.sign({ id: nuevoAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        nuevoAdmin.token = token;  // Asignar el token al admin

        // Enviar correo con el token de confirmación
        await sendMailToUserAdmin(email, token);

        // Guardar el nuevo administrador
        await nuevoAdmin.save();
        console.log("Revisa tu correo electrónico para confirmar tu cuenta");

        // Excluir la contraseña antes de enviar la respuesta
        const { password: _, ...adminSinPassword } = nuevoAdmin.toObject();

    } catch (error) {
        console.error(error);
    }
};

const confirmEmail = async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ msg: "Token no proporcionado" });
    }

    try {
        // Verificar que el token corresponde a un admin válido
        const admin = await Admin.findOne({ token });

        if (!admin) {
            return res.status(404).json({ msg: "Token inválido o expirado"});
        }

        // Confirmar el correo del admin
        admin.confirmEmail = true;
        admin.token = null; // Limpiar el token después de la confirmación
        await admin.save();

        res.status(200).json({ msg: "Correo confirmado exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al confirmar el correo" });
    }
};

// 📌 Iniciar sesión de administrador
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ msg: "Administrador no encontrado" });
        }

        // Verificar si el admin ya ha confirmado su correo
        if (!admin.confirmEmail) {
            return res.status(403).json({ msg: "Debes confirmar tu correo electrónico primero" });
        }

        const passwordCorrecta = await admin.compararPassword(password);

        if (!passwordCorrecta) {
            return res.status(401).json({ msg: "Contraseña incorrecta" });
        }

        // Generar el token para la sesión del admin
        const token = jwt.sign({ id: admin._id, rol: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ msg: "Inicio de sesión exitoso", token });
    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

// 📌 Recuperar contraseña
const recuperarContraseniaController = async (req, res) => {
    const { email } = req.body;

    try {
        if (email !== "estefi2000ms2@gmail.com") {
            return res.status(404).json({ msg: "Correo no válido para recuperación" });
        }

        const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000);

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
        res.status(500).json({ msg: "Error al enviar el código de recuperación" });
    }
};

// 📌 Cambiar contraseña
const cambiarContraseniaController = async (req, res) => {
    const { email, nuevaPassword } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ msg: "Administrador no encontrado" });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(nuevaPassword, salt);
        await admin.save();

        res.json({ msg: "Contraseña cambiada con éxito" });
    } catch (error) {
        res.status(500).json({ msg: "Error al cambiar la contraseña" });
    }
};

export {
    loginAdmin,
    createAdmin,
    confirmEmail,
    recuperarContraseniaController,
    cambiarContraseniaController
};
