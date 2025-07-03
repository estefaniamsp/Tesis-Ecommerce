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

describe("getAllVentasController", () => {
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
});

describe("getVentaByIDController", () => {
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
});

describe("getVentasClienteController", () => {
    test("debería obtener ventas del cliente", async () => {
        req.clienteBDD._id = "cliente-id";
        Ventas.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([{}]) }) });

        await getVentasClienteController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ ventas: [{}] });
    });
});

describe("getFacturaClienteById", () => {
    afterEach(() => jest.clearAllMocks());

    it("debería retornar la factura de una venta", async () => {
        const req = {
            params: { id: "venta123" },
            clienteBDD: { _id: "cli123" }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const ventaMock = {
            _id: "venta123",
            fecha_venta: "2024-01-01",
            total: 100,
            estado: "finalizado",
            cliente_id: {
                _id: "cli123",
                nombre: "Juan",
                apellido: "Pérez",
                email: "juan@example.com"
            },
            productos: [
                {
                    producto_id: {
                        nombre: "Jabón artesanal",
                        imagen: "img.jpg",
                        precio: 10
                    },
                    cantidad: 2,
                    subtotal: 20
                }
            ]
        };

        // 👉 Mock correcto: retorna ventaMock directamente desde populate()
        Ventas.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(ventaMock)
        });

        await getFacturaClienteById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            factura: {
                fecha: "2024-01-01",
                cliente: {
                    nombre: "Juan",
                    apellido: "Pérez",
                    email: "juan@example.com"
                },
                productos: [
                    {
                        producto_id: ventaMock.productos[0].producto_id,
                        nombre: "Jabón artesanal",
                        imagen: "img.jpg",
                        precio: 10,
                        cantidad: 2,
                        subtotal: 20
                    }
                ],
                total: 100,
                estado: "finalizado"
            }
        });
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
});