import Admin from "../models/administrador.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { sendMailToUserAdmin } from "../config/nodemailer.js";

const createAdmin = async () => {
    const email = "admin123@yopmail.com";
    const password = "NuevaPass123$";

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
        return res.status(400).send(`
      <div style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #e67e22;">Token no proporcionado</h2>
        <p>Por favor verifica el enlace o solicita uno nuevo.</p>
      </div>
    `);
    }

    try {
        const admin = await Admin.findOne({ token });

        if (!admin) {
            return res.status(404).send(`
        <div style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #c0392b;">Token inválido o expirado</h2>
          <p>Por favor solicita uno nuevo.</p>
        </div>
      `);
        }

        admin.confirmEmail = true;
        admin.token = null;
        await admin.save();

        return res.status(200).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #27ae60;">¡Correo de administrador confirmado exitosamente!</h2>
        <p>Puedes cerrar esta ventana y continuar usando la aplicación.</p>
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

// Iniciar sesión de administrador
const loginAdmin = async (req, res) => {
    let { email, password } = req.body;
    let { environment } = req.query;
    const WEB = "web";
    const MOBILE = "mobile";

    email = email.trim();
    password = password.trim();
    environment = environment ? environment : WEB;

    if (!email && !password) {
        return res.status(400).json({ msg: "Debes ingresar el email y la contraseña" });
    }
    if (!email) {
        return res.status(400).json({ msg: "El campo 'email' es obligatorio" });
    }
    if (!password) {
        return res.status(400).json({ msg: "El campo 'password' es obligatorio" });
    }

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ msg: "Correo o contraseña incorrectos" });
        }

        // Verificar si el admin ya ha confirmado su correo
        if (!admin.confirmEmail) {
            return res.status(403).json({ msg: "Debes confirmar tu correo electrónico primero" });
        }

        const passwordCorrecta = await admin.compararPassword(password);

        if (!passwordCorrecta) {
            return res.status(401).json({ msg: "Correo o contraseña incorrectos" });
        }

        // Generar el token para la sesión del admin
        let token;
        if (environment === WEB) {
            token = jwt.sign({ id: admin._id, rol: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" })
        } else if (environment === MOBILE) {
            token = jwt.sign({ id: admin._id, rol: "admin" }, process.env.JWT_SECRET)
        } else {
            return res.status(400).json({ msg: "Entorno no válido" });
        }

        res.json({ msg: "Inicio de sesión exitoso", token });
    } catch (error) {
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

// Recuperar contraseña
const recuperarContraseniaController = async (req, res) => {
    let { email } = req.body;

    email = email.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ msg: "El campo 'email' es obligatorio" });
    }

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ msg: "Administrador no encontrado" });
        }

        // Crear código
        const codigoRecuperacion = Math.floor(100000 + Math.random() * 900000);

        // GUARDAR el código en el admin
        admin.codigoRecuperacion = codigoRecuperacion.toString();
        admin.codigoRecuperacionExpires = Date.now() + 10 * 60 * 1000; // 10 minutos desde ahora
        await admin.save();

        // Configurar transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.USER_MAILTRAP,
                pass: process.env.PASS_MAILTRAP,
            },
        });

        // Enviar correo
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
const cambiarContraseniaController = async (req, res) => {
    let { email, nuevaPassword } = req.body;
    let { codigoRecuperacion } = req.query;

    // Limpiar espacios innecesarios
    email = email.trim().toLowerCase();
    nuevaPassword = nuevaPassword.trim();
    codigoRecuperacion = (codigoRecuperacion || "").trim(); // Evitar error si viene undefined

    // Validaciones básicas
    if (!email || !nuevaPassword || !codigoRecuperacion) {
        return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(404).json({ msg: "Administrador no encontrado" });
        }

        // Verificar si el código de recuperación es correcto
        if (
            admin.codigoRecuperacion !== codigoRecuperacion ||
            !admin.codigoRecuperacionExpires ||
            admin.codigoRecuperacionExpires < Date.now()
        ) {
            return res.status(400).json({ msg: "Código de recuperación inválido o expirado" });
        }

        // Actualizar contraseña
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(nuevaPassword, salt);

        // Borrar el código de recuperación usado
        admin.codigoRecuperacion = null;
        admin.codigoRecuperacionExpires = null;

        await admin.save();

        return res.status(200).json({ msg: "Contraseña cambiada con éxito" });
    } catch (error) {
        console.error(error);
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
