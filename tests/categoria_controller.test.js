import {
    getAllCategoriasController,
    getCategoriaByIDController,
    createCategoriaController,
    updateCategoriaController,
    deleteCategoriaController,
} from "../src/controllers/categoria_controller.js";

import Categoria from "../src/models/categorias.js";
import cloudinary from "../src/config/cloudinary.js";
import mongoose from "mongoose";

jest.mock("../src/models/categorias.js");
jest.mock("../src/config/cloudinary.js");

let req, res;

beforeEach(() => {
    req = { params: {}, body: {}, file: {} };
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("getAllCategoriasController", () => {
    test("retorna categorías", async () => {
        Categoria.find.mockResolvedValue([{ nombre: "Jabones" }]);

        await getAllCategoriasController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ categorias: [{ nombre: "Jabones" }] });
    });
});

describe("getCategoriaByIDController", () => {
    test("ID válido y categoría encontrada", async () => {
        req.params.id = new mongoose.Types.ObjectId().toString();
        Categoria.findById.mockResolvedValue({ nombre: "Velas" });

        await getCategoriaByIDController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ categoria: { nombre: "Velas" } });
    });
});

describe("createCategoriaController", () => {
    test("crea categoría exitosamente", async () => {
        req.body = { nombre: "Velas", descripcion: "Decorativas" };
        req.file = { path: "fake-url", filename: "img123" };
        Categoria.findOne.mockResolvedValue(null);
        Categoria.prototype.save = jest.fn();

        await createCategoriaController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: "Categoría creada exitosamente" })
        );
    });
});

describe("updateCategoriaController", () => {
    test("actualiza datos e imagen correctamente", async () => {
        req.params.id = new mongoose.Types.ObjectId().toString();
        req.body = { nombre: "Nueva", descripcion: "Actualizada" };
        req.file = { path: "new-url", filename: "new-img" };

        Categoria.findById.mockResolvedValue({
            nombre: "Antigua",
            descripcion: "Anterior",
            imagen_id: "img123",
            save: jest.fn(),
        });

        await updateCategoriaController(req, res);

        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("img123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ msg: "Categoría actualizada exitosamente" })
        );
    });
});

describe("deleteCategoriaController", () => {
    test("elimina categoría y su imagen", async () => {
        req.params.id = new mongoose.Types.ObjectId().toString();
        Categoria.findById.mockResolvedValue({ imagen_id: "img123" });
        Categoria.findByIdAndDelete.mockResolvedValue(true);

        await deleteCategoriaController(req, res);

        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("img123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ msg: "Categoría eliminada exitosamente" });
    });
});
