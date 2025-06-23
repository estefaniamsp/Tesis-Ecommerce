import {
    getCarritoClienteController,
    addCarritoController,
    updateCantidadProductoController,
    removeProductoCarritoController,
    emptyCarritoController,
    pagarCarritoController
} from "../src/controllers/carrito_controller.js";

import Carrito from "../src/models/carritos.js";
import Clientes from "../src/models/clientes.js";
import Producto from "../src/models/productos.js";
import Ventas from "../src/models/ventas.js";
import mongoose from "mongoose";

jest.mock("stripe", () => {
    return {
        Stripe: jest.fn().mockImplementation(() => ({
            customers: {
                list: jest.fn().mockResolvedValue({ data: [] }),
                create: jest.fn().mockResolvedValue({ id: "cust_123" })
            },
            paymentIntents: {
                create: jest.fn().mockResolvedValue({ id: "pi_123", status: "succeeded" })
            },
            refunds: {
                create: jest.fn().mockResolvedValue({})
            }
        }))
    };
});

jest.mock("../src/models/carritos.js");
jest.mock("../src/models/clientes.js");
jest.mock("../src/models/productos.js");
jest.mock("../src/models/ventas.js");

let req, res;

beforeEach(() => {
    req = {
        body: {},
        params: {},
        clienteBDD: { _id: new mongoose.Types.ObjectId(), nombre: "Ana", apellido: "Lopez", email: "ana@mail.com" }
    };
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

/*describe("getCarritoClienteController", () => {
    test("carrito encontrado", async () => {
        Carrito.findOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue({ _id: "carritoId", productos: [] })
        });

        await getCarritoClienteController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ carrito: expect.any(Object) }));
    });

    test("sin carrito", async () => {
        // Simula que Carrito.findOne().populate() retorna null
        Carrito.findOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
        });

        await getCarritoClienteController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ msg: "No tienes un carrito asociado aún" });
    });
});*/


/*describe("addCarritoController", () => {
    test("agrega producto correctamente", async () => {
        req.body = { producto_id: new mongoose.Types.ObjectId().toString(), cantidad: 2 };

        Clientes.findById.mockResolvedValue({ _id: req.clienteBDD._id });
        Producto.findById.mockResolvedValue({ _id: req.body.producto_id, nombre: "Jabón", stock: 5, precio: 3, activo: true });
        Carrito.findOne.mockResolvedValue({
            _id: "carritoId",
            cliente_id: req.clienteBDD._id,
            estado: "pendiente",
            productos: [],
            save: jest.fn(),
            total: 0
        });
        Carrito.findById.mockResolvedValue({
            _id: "carritoId",
            productos: [
                {
                    producto_id: req.body.producto_id,
                    cantidad: 2,
                    precio_unitario: 3,
                    subtotal: 6
                }
            ]
        });

        await addCarritoController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: "Producto agregado al carrito" }));
    });
});*/

/*describe("updateCantidadProductoController", () => {
    test("aumenta y recalcula subtotal", async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        req.body = { producto_id: prodId, cantidad: 1 };

        Carrito.findOne.mockResolvedValue({
            productos: [
                { producto_id: prodId, cantidad: 1, subtotal: 3, precio_unitario: 3 }
            ],
            save: jest.fn(),
            total: 3
        });
        Producto.findById.mockResolvedValue({ _id: prodId, nombre: "Jabón", stock: 5, precio: 3, activo: true });

        await updateCantidadProductoController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

describe("removeProductoCarritoController", () => {
    test("elimina producto", async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        req.body = { producto_id: prodId };

        Carrito.findOne.mockResolvedValue({
            productos: [{ producto_id: prodId, subtotal: 3 }],
            save: jest.fn(),
            total: 3
        });

        await removeProductoCarritoController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: "Producto eliminado del carrito" }));
    });
});*/

describe("emptyCarritoController", () => {
    test("vacía carrito", async () => {
        Carrito.findOne.mockResolvedValue({ productos: [{}, {}], total: 10, estado: "pendiente", save: jest.fn() });

        await emptyCarritoController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ msg: "El carrito fue vaciado exitosamente." });
    });
});

/*describe("pagarCarritoController", () => {
    test("paymentMethodId faltante", async () => {
        req.body = { paymentMethodId: "" };
        await pagarCarritoController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});*/
