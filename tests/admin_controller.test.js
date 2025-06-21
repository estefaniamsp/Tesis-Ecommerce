import {
    loginAdmin,
    confirmEmail,
    recuperarContraseniaController,
    cambiarContraseniaController
} from "../src/controllers/admin_controller.js";

import Admin from "../src/models/administrador.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Mocks
jest.mock("../src/models/administrador.js");
jest.mock("nodemailer");
jest.mock("jsonwebtoken");
jest.mock("bcrypt");

/*describe("Pruebas Unitarias - Admin - Login", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                email: "admin123@yopmail.com",
                password: "NuevoPass123$",
            },
            query: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test.only("Debería iniciar sesión correctamente con credenciales válidas", async () => {
        const adminMock = {
            _id: "mock-id",
            email: req.body.email,
            confirmEmail: true,
            compararPassword: jest.fn().mockResolvedValue(true),
        };

        Admin.findOne.mockResolvedValue(adminMock);
        jwt.sign.mockReturnValue("token-mock");

        await loginAdmin(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: "admin123@yopmail.com" });
        expect(adminMock.compararPassword).toHaveBeenCalledWith("NuevoPass123$");
        expect(res.status).not.toHaveBeenCalled(); // porque se llama directamente res.json
        expect(res.json).toHaveBeenCalledWith({
            msg: "Inicio de sesión exitoso",
            token: "token-mock",
        });
    });
});*/

/*describe("Pruebas Unitarias - Admin - Confirmación de Email", () => {
    let req, res;

    beforeEach(() => {
        req = { params: { token: "mock-token" } };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Debería confirmar el email correctamente", async () => {
        const adminMock = {
            confirmEmail: false,
            token: "mock-token",
            save: jest.fn(),
        };

        Admin.findOne.mockResolvedValue(adminMock);

        await confirmEmail(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ token: "mock-token" });
        expect(adminMock.confirmEmail).toBe(true);
        expect(adminMock.token).toBe(null);
        expect(adminMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});*/

describe("Pruebas Unitarias - Admin - Recuperar Contraseña", () => {
    let req, res;
    let mockTransport;

    beforeEach(() => {
        req = {
            body: {
                email: "admin123@yopmail.com"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockTransport = {
            sendMail: jest.fn().mockResolvedValue(true),
        };

        nodemailer.createTransport.mockReturnValue(mockTransport);

        Admin.findOne.mockResolvedValue({
            email: req.body.email,
            save: jest.fn()
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Debería enviar código de recuperación si el admin existe", async () => {
        await recuperarContraseniaController(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: "admin123@yopmail.com" });
        expect(mockTransport.sendMail).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled(); // porque se llama res.json directo
        expect(res.json).toHaveBeenCalledWith({ msg: "Código de recuperación enviado al correo" });
    });

    test("Debería retornar error si el email está vacío", async () => {
        req.body.email = "";

        await recuperarContraseniaController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: "El campo 'email' es obligatorio" });
    });

    test("Debería retornar error si no se encuentra el admin", async () => {
        Admin.findOne.mockResolvedValue(null);

        await recuperarContraseniaController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: "Administrador no encontrado" });
    });
});

/*describe("Pruebas Unitarias - Admin - Cambiar Contraseña", () => {
    let req, res;
    const adminMock = {
        email: "admin123@yopmail.com",
        codigoRecuperacion: "123456",
        codigoRecuperacionExpires: Date.now() + 600000, // 10 min en el futuro
        save: jest.fn()
    };

    beforeEach(() => {
        req = {
            body: {
                email: adminMock.email,
                nuevaPassword: "NuevoPass123$"
            },
            query: {
                codigoRecuperacion: "123456"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        Admin.findOne.mockResolvedValue(adminMock);
        bcrypt.genSalt.mockResolvedValue("mockSalt");
        bcrypt.hash.mockResolvedValue("hashedPassword");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Debería cambiar la contraseña con éxito", async () => {
        await cambiarContraseniaController(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: "admin123@yopmail.com" });
        expect(bcrypt.hash).toHaveBeenCalledWith("NuevoPass123$", "mockSalt");
        expect(adminMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ msg: "Contraseña cambiada con éxito" });
    });

    test("Debería devolver error si algún campo falta", async () => {
        req.body.nuevaPassword = "";

        await cambiarContraseniaController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: "Todos los campos son obligatorios" });
    });

    test("Debería devolver error si código es inválido", async () => {
        req.query.codigoRecuperacion = "000000";

        await cambiarContraseniaController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: "Código de recuperación inválido o expirado" });
    });

    test("Debería devolver error si el admin no existe", async () => {
        Admin.findOne.mockResolvedValue(null);

        await cambiarContraseniaController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: "Administrador no encontrado" });
    });
});*/
