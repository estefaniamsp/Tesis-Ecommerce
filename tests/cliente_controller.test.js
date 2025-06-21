import {
    loginCliente,
    registerCliente,
    updateClienteProfile,
    getClienteProfile,
    recuperarContrasenia,
    cambiarContrasenia,
    confirmEmail,
    getAllClientes,
    getClienteById,
    desactiveClienteAdmin,
    activeClienteAdmin,


} from "../src/controllers/cliente_controller.js";

import Clientes from "../src/models/clientes.js";
import nodemailer from "nodemailer";
import Admin from "../src/models/administrador.js";
import Carrito from "../src/models/carritos.js";


import { generarJWT, generarJWTSinCaducidad } from "../src/T_helpers/crearJWT.js";

jest.mock("../src/models/clientes.js");
jest.mock("../src/models/administrador.js");
jest.mock("../src/models/carritos.js");
jest.mock("bcrypt");
jest.mock("../src/config/nodemailer.js");

/*test("Debería registrar un cliente exitosamente", async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const crearTokenMock = jest.fn().mockReturnValue("token-cliente");

    Clientes.findOne.mockResolvedValueOnce(null); // cliente
    Admin.findOne.mockResolvedValueOnce(null); // admin
    Clientes.mockImplementation(() => ({
        save: saveMock,
        crearToken: crearTokenMock,
        toObject: () => ({
            _id: "cliente-id",
            nombre: "Pedro",
            apellido: "Lopez",
            genero: "masculino",
            email: "juan123@yopmail.com",
        })
    }));

    Carrito.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true)
    }));

    const req = {
        body: {
            nombre: "Pedro",
            apellido: "Lopez",
            genero: "masculino",
            email: "juan123@yopmail.com",
            password: "NuevaPass123$"
        }
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await registerCliente(req, res);

    expect(Clientes.findOne).toHaveBeenCalledWith({ email: "juan123@yopmail.com" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        msg: "Revisa tu correo electrónico para confirmar tu cuenta",
        cliente: {
            _id: "cliente-id",
            nombre: "Pedro",
            apellido: "Lopez",
            genero: "masculino",
            email: "juan123@yopmail.com",
        }
    });
});*/

/*describe("Pruebas Unitarias - Cliente - Login", () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                email: "cliente@correo.com",
                password: "clave123"
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

    test("Debería iniciar sesión correctamente con credenciales válidas y entorno web", async () => {
        const clienteMock = {
            _id: "cliente-id",
            nombre: "Ana",
            apellido: "Pérez",
            genero: "femenino",
            email: req.body.email,
            estado: "activo",
            confirmEmail: true,
            matchPassword: jest.fn().mockResolvedValue(true)
        };

        Clientes.findOne.mockResolvedValue(clienteMock);
        generarJWT.mockReturnValue("token-mock");

        await loginCliente(req, res);

        expect(Clientes.findOne).toHaveBeenCalledWith({ email: "cliente@correo.com" });
        expect(clienteMock.matchPassword).toHaveBeenCalledWith("clave123");
        expect(generarJWT).toHaveBeenCalledWith("cliente-id", "Ana");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            token: "token-mock",
            nombre: "Ana",
            apellido: "Pérez",
            genero: "femenino",
            email: "cliente@correo.com",
            _id: "cliente-id"
        });
    });
});*/

/*test("Debería actualizar el perfil del cliente", async () => {
    const saveMock = jest.fn();
    Clientes.findById.mockResolvedValue({
        _id: "cliente-id",
        cedula: "0000000000",
        nombre: "Ana",
        apellido: "Perez",
        genero: "femenino",
        email: "ana@correo.com",
        direccion: "Antigua",
        telefono: "0999999999",
        fecha_nacimiento: "2000-01-01",
        imagen: "url",
        imagen_id: "img-id",
        save: saveMock
    });

    const req = {
        clienteBDD: { _id: "cliente-id" },
        body: {
            nombre: "Ana",
            apellido: "Perez",
            telefono: "0912345678"
        }
    };

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await updateClienteProfile(req, res);

    expect(Clientes.findById).toHaveBeenCalledWith("cliente-id");
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        msg: "Perfil actualizado con éxito",
        cliente: expect.objectContaining({
            nombre: "Ana",
            apellido: "Perez",
            telefono: "0912345678"
        })
    });
});*/

test("Debería devolver el perfil del cliente si existe", async () => {
    Clientes.findById.mockResolvedValue({
        _id: "cliente-id",
        cedula: "1234567890",
        nombre: "Mario",
        apellido: "Sánchez",
        genero: "masculino",
        email: "mario@correo.com",
        direccion: "Quito",
        telefono: "0999999999",
        fecha_nacimiento: "1990-01-01",
        imagen: "url-imagen"
    });

    const req = { clienteBDD: { _id: "cliente-id" } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await getClienteProfile(req, res);

    expect(Clientes.findById).toHaveBeenCalledWith("cliente-id");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        msg: "Perfil obtenido correctamente",
        cliente: expect.objectContaining({
            nombre: "Mario",
            apellido: "Sánchez",
            genero: "masculino",
        })
    });
});

jest.mock("nodemailer");
const sendMailMock = jest.fn().mockResolvedValue({ messageId: "mock-id" });

nodemailer.createTransport.mockReturnValue({
    sendMail: sendMailMock
});

/*test("Debería enviar código de recuperación si el cliente existe", async () => {
    const saveMock = jest.fn();
    Clientes.findOne.mockResolvedValue({
        email: "cliente@correo.com",
        save: saveMock
    });

    const req = { body: { email: "cliente@correo.com" } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await recuperarContrasenia(req, res);

    expect(Clientes.findOne).toHaveBeenCalledWith({ email: "cliente@correo.com" });
    expect(saveMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        msg: "El código de recuperación ha sido enviado a tu correo"
    });
});

jest.mock("bcrypt");

test("Debería cambiar la contraseña con código correcto", async () => {
    const saveMock = jest.fn();
    const clienteMock = {
        password: "viejaClave",
        codigoRecuperacion: "123456",
        codigoRecuperacionExpires: Date.now() + 60000,
        save: saveMock
    };

    Clientes.findOne.mockResolvedValue(clienteMock);
    bcrypt.genSalt.mockResolvedValue("mockSalt");
    bcrypt.hash.mockResolvedValue("hashedPassword");

    const req = {
        body: {
            email: "cliente@correo.com",
            nuevaPassword: "nuevaClave123"
        },
        query: {
            codigoRecuperacion: "123456"
        }
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await cambiarContrasenia(req, res);

    expect(Clientes.findOne).toHaveBeenCalledWith({ email: "cliente@correo.com" });
    expect(bcrypt.hash).toHaveBeenCalledWith("nuevaClave123", "mockSalt");
    expect(saveMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
        msg: "Contraseña cambiada con éxito. Ya puedes iniciar sesión."
    });
});

test("Debería confirmar el correo del cliente si el token es válido", async () => {
    const saveMock = jest.fn();
    const clienteMock = {
        confirmEmail: false,
        token: "token123",
        save: saveMock
    };

    Clientes.findOne.mockResolvedValue(clienteMock);

    const req = { params: { token: "token123" } };
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
    };

    await confirmEmail(req, res);

    expect(Clientes.findOne).toHaveBeenCalledWith({ token: "token123" });
    expect(clienteMock.confirmEmail).toBe(true);
    expect(clienteMock.token).toBe(null);
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
});*/

/*test("Debería obtener todos los clientes con paginación", async () => {
    Clientes.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                    { nombre: "Cliente 1" },
                    { nombre: "Cliente 2" }
                ])
            })
        })
    });

    Clientes.countDocuments.mockResolvedValue(2);

    const req = { query: { page: "1", limit: "2" } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await getAllClientes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        totalClientes: 2,
        totalPaginas: 1,
        paginaActual: 1,
        clientes: [
            { nombre: "Cliente 1" },
            { nombre: "Cliente 2" }
        ]
    });
});*/

/*test("Debería obtener un cliente por ID si es válido", async () => {
    const clienteMock = { nombre: "Juan", email: "juan@correo.com" };

    Clientes.findById.mockResolvedValue(clienteMock);

    const req = { params: { id: "507f1f77bcf86cd799439011" } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await getClienteById(req, res);

    expect(Clientes.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        msg: "Cliente encontrado exitosamente",
        cliente: clienteMock
    });
});

test("Debería desactivar un cliente si está activo", async () => {
    const clienteMock = {
        _id: "507f1f77bcf86cd799439011",
        nombre: "Andrea",
        apellido: "López",
        estado: "activo"
    };

    Clientes.findById.mockResolvedValue(clienteMock);
    Clientes.findByIdAndUpdate.mockResolvedValue({ ...clienteMock, estado: "inactivo" });

    const req = { params: { id: "507f1f77bcf86cd799439011" } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await desactiveClienteAdmin(req, res);

    expect(Clientes.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(Clientes.findByIdAndUpdate).toHaveBeenCalledWith("507f1f77bcf86cd799439011", { estado: "inactivo" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        msg: "Estado del cliente 'Andrea López' actualizado a inactivo exitosamente"
    });
});

test("Debería activar un cliente si está inactivo", async () => {
    const clienteMock = {
        _id: "507f1f77bcf86cd799439011",
        nombre: "Andrea",
        apellido: "López",
        estado: "inactivo"
    };

    Clientes.findById.mockResolvedValue(clienteMock);
    Clientes.findByIdAndUpdate.mockResolvedValue({ ...clienteMock, estado: "activo" });

    const req = { params: { id: "507f1f77bcf86cd799439011" } };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };

    await activeClienteAdmin(req, res);

    expect(Clientes.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(Clientes.findByIdAndUpdate).toHaveBeenCalledWith("507f1f77bcf86cd799439011", { estado: "activo" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        msg: "Estado del cliente 'Andrea López' actualizado a inactivo exitosamente"
    });
});*/
