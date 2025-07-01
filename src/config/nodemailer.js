import nodemailer from "nodemailer"
import dotenv from 'dotenv'
dotenv.config()

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
});

const sendMailToUser = (userMail, token) => {

    let mailOptions = {
        from: process.env.USER_MAILTRAP,
        to: userMail,
        subject: "Verifica tu cuenta",
        html: `
  <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
    <h2 style="text-align: center; color: #2c3e50;">¡Bienvenido a nuestra plataforma!</h2>
    <p style="font-size: 16px; color: #333;">Hola,</p>
    <p style="font-size: 16px; color: #333;">
      Gracias por registrarte. Para activar tu cuenta, por favor haz clic en el botón de abajo:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.URL_FRONTEND}clientes/confirmar-email/${encodeURIComponent(token)}" 
         style="background-color: #27ae60; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px;">
        Confirmar cuenta
      </a>
    </div>
    <p style="font-size: 14px; color: #555;">Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
    <p style="font-size: 14px; color: #aaa; text-align: center; margin-top: 40px;">&copy; ${new Date().getFullYear()} Flor & Cera. Todos los derechos reservados.</p>
  </div>
`
    };


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Correo enviado: ' + info.response);
        }
    });
};

const sendMailToUserAdmin = (userMail, token) => {

    let mailOptions = {
        from: process.env.USER_MAILTRAP,
        to: userMail,
        subject: "Verifica tu cuenta",
        html: `<p>Hola, haz clic <a href="${process.env.URL_FRONTEND}admin/confirmar-email/${encodeURIComponent(token)}">aquí</a> para confirmar tu cuenta.</p>`
    };


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Correo enviado: ' + info.response);
        }
    });
};

export {
    sendMailToUser,
    sendMailToUserAdmin
}