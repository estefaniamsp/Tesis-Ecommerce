import VistaProducto from "../models/vistaProducto.js";

const obtenerUltimasVistasCliente = async (req, res) => {
    try {
        if (!req.clienteBDD) {
            return res.status(401).json({ msg: "No autorizado" });
        }

        const vistas = await VistaProducto.find({ cliente_id: req.clienteBDD._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("producto_id", "nombre tipo id_categoria");

        return res.status(200).json({
            vistas: vistas.map(v => ({
                producto_id: v.producto_id._id,
                nombre: v.producto_id.nombre,
                tipo: v.producto_id.tipo,
                categoria: v.producto_id.id_categoria,
                fecha: v.createdAt
            }))
        });
    } catch (error) {
        console.error("Error al obtener vistas:", error);
        return res.status(500).json({ msg: "Error al obtener vistas", error: error.message });
    }
};
// Exportar los controladores
export { 
    obtenerUltimasVistasCliente 
};