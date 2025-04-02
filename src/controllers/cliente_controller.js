import Cliente from "../models/clientes.js";
import mongoose from "mongoose";

const getAllClientesController = async (req, res) => {
    try {
        const clientes = await Cliente.find();   
        res.status(200).json(clientes)
    } catch (error) {
        res.json(error)
    }
}

const getClienteByIDController = async (req, res) => {
    const { id } = req.params
    try {
        const cliente = await Cliente.findById(id);
        const status = cliente.error ? 404 : 200
        res.status(status).json(cliente)
    } catch (error) {
        res.status(500).json(error)
    }
}

const createClienteController = async (req, res) => {
    const { cedula, email } = req.body;

    // Verificar si hay campos vacíos
    if (Object.values(req.body).includes("")) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    try {
        // Verificar si la cédula ya está registrada
        const verificarCedulaBDD = await Cliente.findOne({ cedula });
        if (verificarCedulaBDD) {
            return res.status(400).json({ msg: "Lo sentimos, la cédula ya se encuentra registrada" });
        }

        // Verificar si el email ya está registrado
        const verificarEmailBDD = await Cliente.findOne({ email });
        if (verificarEmailBDD) {
            return res.status(400).json({ msg: "Lo sentimos, el email ya se encuentra registrado" });
        }

        // Crear y guardar el nuevo cliente
        const nuevoCliente = new Cliente(req.body);
        await nuevoCliente.save();

        res.status(201).json({ msg: "Cliente registrado exitosamente", cliente: nuevoCliente });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const updateClienteController = async (req, res) => {
    const { id } = req.body;

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "Lo sentimos, el cliente no existe" });
    }

    // Verificar si hay campos vacíos
    if (Object.values(req.body).includes("")) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    try {
        // Verificar si la cédula ya está registrada en otro cliente
        if (req.body.cedula) {
            const verificarCedulaBDD = await Cliente.findOne({ cedula: req.body.cedula });
            if (verificarCedulaBDD && verificarCedulaBDD._id.toString() !== id) {
                return res.status(400).json({ msg: "Lo sentimos, la cédula ya está registrada" });
            }
        }

        // Verificar si el email ya está registrado en otro cliente
        if (req.body.email) {
            const verificarEmailBDD = await Cliente.findOne({ email: req.body.email });
            if (verificarEmailBDD && verificarEmailBDD._id.toString() !== id) {
                return res.status(400).json({ msg: "Lo sentimos, el email ya está registrado" });
            }
        }

        // Actualizar cliente
        const clienteActualizado = await Cliente.findByIdAndUpdate(id, req.body, { new: true });

        if (!clienteActualizado) {
            return res.status(404).json({ msg: "Cliente no encontrado" });
        }

        res.status(200).json({ msg: "Cliente actualizado con éxito", cliente: clienteActualizado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteClienteController = async (req, res) => {
    const { id } = req.body;

    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "Lo sentimos, el cliente no existe" });
    }

    try {
        // Buscar y eliminar cliente
        const clienteEliminado = await Cliente.findByIdAndDelete(id);

        if (!clienteEliminado) {
            return res.status(404).json({ msg: "Cliente no encontrado" });
        }

        res.status(200).json({ msg: `El cliente fue eliminado con id: ${id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export{
    getAllClientesController,
    getClienteByIDController,
    createClienteController,
    updateClienteController,
    deleteClienteController
}