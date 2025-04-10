import Carritos from "../models/carritos.js";
import mongoose from "mongoose";

// Obtener todos los carritos
const getAllCarritosController = async (req, res) => {
    try {
        const carritos = await Carritos.find().populate('cliente').populate('productos.producto');
        res.status(200).json(carritos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un carrito por ID
const getCarritoByIDController = async (req, res) => {
    const { id } = req.params;
    try {
        const carrito = await Carritos.findById(id).populate('cliente').populate('productos.producto');
        const status = carrito ? 200 : 404;
        res.status(status).json(carrito || { msg: "Carrito no encontrado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear un carrito
const createCarritoController = async (req, res) => {
    const { clienteId, productos } = req.body;

    // Verificar si hay campos vacíos
    if (!clienteId || productos.length === 0) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    try {
        // Crear y guardar el nuevo carrito
        const nuevoCarrito = new Carritos(req.body);
        await nuevoCarrito.save();

        res.status(201).json({ msg: "Carrito creado exitosamente", carrito: nuevoCarrito });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar un carrito
const updateCarritoController = async (req, res) => {
    const { id } = req.params;
    const { productos, total, estado } = req.body;

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "Lo sentimos, el carrito no existe" });
    }

    // Verificar si hay campos vacíos
    if (!productos || productos.length === 0) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    try {
        // Actualizar el carrito
        const carritoActualizado = await Carritos.findByIdAndUpdate(id, req.body, { new: true });

        if (!carritoActualizado) {
            return res.status(404).json({ msg: "Carrito no encontrado" });
        }

        res.status(200).json({ msg: "Carrito actualizado con éxito", carrito: carritoActualizado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un carrito
const deleteCarritoController = async (req, res) => {
    const { id } = req.params;

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "Lo sentimos, el carrito no existe" });
    }

    try {
        // Buscar y eliminar el carrito
        const carritoEliminado = await Carritos.findByIdAndDelete(id);

        if (!carritoEliminado) {
            return res.status(404).json({ msg: "Carrito no encontrado" });
        }

        res.status(200).json({ msg: `El carrito con id ${id} fue eliminado exitosamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export {
    getAllCarritosController,
    getCarritoByIDController,
    createCarritoController,
    updateCarritoController,
    deleteCarritoController
};
