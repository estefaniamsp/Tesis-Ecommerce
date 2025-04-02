import Admin from "../models/administrador.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

// 📌 Iniciar sesión de administrador
const loginAdmin = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const admin = await Admin.findOne({ usuario });

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
    const { usuario, nuevaPassword } = req.body;

    try {
        const admin = await Admin.findOne({ usuario });

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
    recuperarContraseniaController,
    cambiarContraseniaController
};
