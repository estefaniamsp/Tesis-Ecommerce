import {
    getAllVentasController,
    getVentaByIDController,
    updateVentaController,
    deleteVentaController,
    getVentasClienteController,
    getFacturaClienteById,
    getDashboardController
} from "../src/controllers/venta_controller.js";

import Ventas from "../src/models/ventas.js";
import Clientes from "../src/models/clientes.js";
import Producto from "../src/models/productos.js";
import mongoose from "mongoose";

jest.mock("../src/models/ventas.js");
jest.mock("../src/models/clientes.js");
jest.mock("../src/models/productos.js");

let req, res;

beforeEach(() => {
    req = { params: {}, body: {}, query: {}, headers: {}, clienteBDD: {} };
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

/*describe("getAllVentasController", () => {
    test("debería retornar ventas paginadas", async () => {
        Ventas.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([{}])
                })
            })
        });
        Ventas.countDocuments.mockResolvedValue(1);

        await getAllVentasController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ totalVentas: 1 })
        );
    });
});*/

/*describe("getVentaByIDController", () => {
    test("debería retornar una venta por id", async () => {
        req.params.id = "venta-id";
        Ventas.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ total: 100 }) });

        await getVentaByIDController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ total: 100 });
    });
});

describe("updateVentaController", () => {
    test("debería actualizar el estado de una venta", async () => {
        req.params.id = "venta-id";
        req.body.estado = "pendiente";
        Ventas.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue({ estado: "pendiente" }) });

        await updateVentaController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ venta: { estado: "pendiente" } }));
    });
});

describe("deleteVentaController", () => {
    test("debería eliminar una venta y devolver productos al stock", async () => {
        req.params.id = "venta-id";
        Ventas.findById.mockResolvedValue({ productos: [{ producto_id: "id", cantidad: 1 }] });
        Producto.findById.mockResolvedValue({ stock: 5, save: jest.fn() });
        Ventas.findByIdAndDelete.mockResolvedValue(true);

        await deleteVentaController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ msg: expect.stringContaining("eliminada exitosamente") });
    });
});*/

describe("getVentasClienteController", () => {
    test("debería obtener ventas del cliente", async () => {
        req.clienteBDD._id = "cliente-id";
        Ventas.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([{}]) }) });

        await getVentasClienteController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ ventas: [{}] });
    });
});

/*describe("getFacturaClienteById", () => {
    test("debería retornar la factura de una venta", async () => {
        req.params.id = "venta-id";
        req.clienteBDD._id = "cliente-id";
        Ventas.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue({ cliente_id: { _id: "cliente-id", email: "test@mail.com" } }) });

        await getFacturaClienteById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ factura: expect.any(Object) });
    });
});

describe("getDashboardController", () => {
    test("debería retornar métricas del dashboard", async () => {
        req.query = { fechaInicio: "2024-01-01", fechaFin: "2024-01-31" };
        Clientes.countDocuments.mockResolvedValue(3);
        Ventas.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) });

        await getDashboardController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ numeroClientes: 3 }));
    });
});*/