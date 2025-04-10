import Admin from "../models/administrador.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import sendMailToUser from "../config/nodemailer.js";

const createAdmin = async () => {
    const email = "estefi2000ms2@gmail.com";
    const password = "admin1234";

    // Verificar que no haya campos vacíos
    if (!email|| !password) {
        console.log("Todos los campos son obligatorios");
        return;
    }

    // Verificar si el email ya está registrado
    const verificarEmailBDD = await Admin.findOne({ email, password });

    if (verificarEmailBDD) {
        console.log("El email ya se encuentra registrado");
        return;
    }

    try {
        // Crear nuevo cliente con todos los campos
        const nuevoAdmin = new Admin({ email , password });

        // Encriptar la contraseña
        nuevoAdmin.password = await nuevoAdmin.encryptPassword(password);
        const token = nuevoAdmin.crearToken()
        await sendMailToUser(email,token)
        await nuevoAdmin.save();
        console.log("Revisa tu correo electrónico para confirmar tu cuenta");

        // Excluir la contraseña antes de enviar la respuesta
        const { password: _, ...clienteSinPassword } = nuevoAdmin.toObject();
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
        const admin = await Admin.findOne({ token });

        if (!admin) {
            return res.status(404).json({ msg: "Token inválido o expirado" });
        }

        admin.confirmEmail = true;
        admin.token = null; // Limpiar el token
        await admin.save();

        res.status(200).json({ msg: "Correo confirmado exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error al confirmar el correo" });
    }
}

// 📌 Iniciar sesión de administrador
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ msg: "Administrador no encontrado" });
        }

        const passwordCorrecta = await admin.compararPassword(password);

        if (!passwordCorrecta) {
            return res.status(401).json({ msg: "Contraseña incorrecta" });
        }

        // Generar token
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ msg: "Inicio de sesión exitoso", token });
    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

// 📌 Recuperar contraseña
const recuperarContraseniaController = async (req, res) => {
    const { email } = req.body;

    try {
        if (email !== "admin@gmail.com") {
            return res.status(404).json({ msg: "Correo no válido para recuperación" });
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
