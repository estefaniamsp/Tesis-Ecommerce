// tests/productos_controller.test.js
import mongoose from "mongoose";
import cloudinary from "../src/config/cloudinary.js";
import {
    createProductoController,
    getAllProductosController,
    getProductoByIDController,
    updateProductoController,
    deleteProductoController,
    reactivarProductoController,
    personalizarProductoIAController
} from "../src/controllers/producto_controller.js";

import Producto from "../src/models/productos.js";
import Ingrediente from "../src/models/ingredientes.js";
import Categoria from "../src/models/categorias.js";
import VistaProducto from "../src/models/vistaProducto.js";
import ProductoPersonalizado from "../src/models/productosPersonalizados.js";
import { recomendarProductoConHF } from "../src/services/huggingFaceIA.js";

jest.mock("../src/models/productos.js");
jest.mock("../src/models/ingredientes.js");
jest.mock("../src/models/categorias.js");
jest.mock("../src/models/vistaProducto.js");
jest.mock("../src/models/productosPersonalizados.js");
jest.mock("../src/config/cloudinary.js", () => ({
    uploader: { destroy: jest.fn() }
}));
jest.mock("../src/services/huggingFaceIA.js");
jest.spyOn(mongoose.Types.ObjectId, "isValid").mockImplementation(() => true);

/* util para response */
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
};
/* util para reset */
const clearMocks = () => {
    jest.clearAllMocks();
};

describe("getAllProductosController", () => {
    afterEach(clearMocks);

    const chainableFind = (dataOrPromise) => ({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue(dataOrPromise)
    });

    it("debería devolver lista paginada (200)", async () => {
        const req = { query: { page: "1", limit: "10" } };
        const res = mockRes();

        Producto.find.mockReturnValue(chainableFind(Promise.resolve([{ nombre: "jabón A" }])));
        Producto.countDocuments.mockResolvedValue(1);

        await getAllProductosController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ totalProductos: 1, productos: [{ nombre: "jabón A" }] })
        );
    });

    it("debería responder 404 si no hay productos", async () => {
        const req = { query: {} };
        const res = mockRes();

        Producto.find.mockReturnValue(chainableFind(Promise.resolve([])));
        Producto.countDocuments.mockResolvedValue(0);

        await getAllProductosController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("maneja errores internos (500)", async () => {
        const req = { query: {} };
        const res = mockRes();

        // Simulamos fallo en la BD durante el .limit()
        Producto.find.mockReturnValue(chainableFind(Promise.reject(new Error("DB down"))));

        await getAllProductosController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("getProductoByIDController", () => {
  afterEach(clearMocks);

  it("devuelve producto (200) y registra vista", async () => {
    const productoFake = { _id: "prod1", activo: true };
    Producto.findById.mockResolvedValue(productoFake);
    VistaProducto.create.mockResolvedValue({});

    const req = { params: { id: "prod1" }, clienteBDD: { _id: "cli1" } };
    const res = mockRes();

    await getProductoByIDController(req, res);

    expect(Producto.findById).toHaveBeenCalledWith("prod1");
    expect(VistaProducto.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("404 si producto no está activo", async () => {
    Producto.findById.mockResolvedValue({ activo: false });
    const req = { params: { id: "prod1" } };
    const res = mockRes();

    await getProductoByIDController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("400 para id inválido", async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

    const req = { params: { id: "badId" } };
    const res = mockRes();

    await getProductoByIDController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("createProductoController", () => {
  afterEach(clearMocks);

  const baseReq = {
    body: {
      nombre: "Jabón Aloe",
      descripcion: "limpia",
      precio: 10,
      stock: 5,
      id_categoria: "cat1",
      aroma: "Aloe",
      tipo: "piel seca",
      ingredientes: ["ing1", "ing2"],
      beneficios: ["hidrata"]
    },
    file: { path: "img.jpg", filename: "img" }
  };

  it("201 si todo OK", async () => {
    Ingrediente.find.mockResolvedValue([{ _id: "ing1" }, { _id: "ing2" }]);
    Categoria.findById.mockResolvedValue({ nombre: "Jabones artesanales" });
    Producto.findOne.mockResolvedValue(null);
    Producto.prototype.save = jest.fn().mockResolvedValue({});
    Producto.prototype.populate = jest.fn().mockResolvedValue({});

    const res = mockRes();
    await createProductoController({ ...baseReq }, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("400 si faltan campos", async () => {
    const req = { body: { ...baseReq.body, precio: null }, file: baseReq.file };
    const res = mockRes();

    await createProductoController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("400 si nombre duplicado y elimina imagen", async () => {
    Producto.findOne.mockResolvedValue({ _id: "dup" });
    const res = mockRes();

    await createProductoController({ ...baseReq }, res);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("img");
    expect(res.status).toHaveBeenCalledWith(400);
  });
});


describe("updateProductoController", () => {
  afterEach(clearMocks);

  it("200 al actualizar", async () => {
    Producto.findById.mockResolvedValue({ _id: "p1", activo: true });
    Producto.findByIdAndUpdate.mockResolvedValue({ nombre: "nuevo" });

    const req = { params: { id: "p1" }, body: { nombre: "nuevo" } };
    const res = mockRes();

    await updateProductoController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("404 si producto no existe", async () => {
    Producto.findById.mockResolvedValue(null);

    const req = { params: { id: "nope" }, body: {} };
    const res = mockRes();

    await updateProductoController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("deleteProductoController", () => {
  afterEach(clearMocks);

  it("200 y desactiva", async () => {
    Producto.findById.mockResolvedValue({ _id: "p1", activo: true });
    Producto.findByIdAndUpdate.mockResolvedValue({ activo: false });

    const req = { params: { id: "p1" } };
    const res = mockRes();

    await deleteProductoController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("400 si ya está inactivo", async () => {
    Producto.findById.mockResolvedValue({ _id: "p1", activo: false });
    const req = { params: { id: "p1" } };
    const res = mockRes();

    await deleteProductoController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("reactivarProductoController", () => {
  afterEach(clearMocks);

  it("200 al reactivar", async () => {
    Producto.findById.mockResolvedValue({ _id: "p1", activo: false, save: jest.fn() });

    const req = { params: { id: "p1" } };
    const res = mockRes();

    await reactivarProductoController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("400 si ya está activo", async () => {
    Producto.findById.mockResolvedValue({ _id: "p1", activo: true });

    const req = { params: { id: "p1" } };
    const res = mockRes();

    await reactivarProductoController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("personalizarProductoIAController", () => {
  afterEach(clearMocks);

  it("403 si no hay cliente", async () => {
    const req = { body: {}, clienteBDD: null };
    const res = mockRes();

    await personalizarProductoIAController(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("201 en flujo feliz", async () => {
    recomendarProductoConHF.mockResolvedValue({
      producto_personalizado: {
        molde: { _id: "i1" },
        color: { _id: "i2" },
        aroma: { _id: "i3", nombre: "Lavanda" },
        esencias: [{ _id: "i4" }, { _id: "i5" }],
        tipo: "jabón IA",
        precio: 12
      }
    });
    ProductoPersonalizado.prototype.save = jest.fn().mockResolvedValue({});

    const req = { body: { tipo: "jabón IA", id_categoria: "cat1" }, clienteBDD: { _id: "cli1" } };
    const res = mockRes();

    await personalizarProductoIAController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(ProductoPersonalizado.prototype.save).toHaveBeenCalled();
  });
});
