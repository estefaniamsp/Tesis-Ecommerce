// middlewares/handleMulterError.js
import multer from "multer";

export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ msg: "La imagen no debe pesar más de 2MB." });
        }
        return res.status(400).json({ msg: `Error de carga: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ msg: err.message || "Error al subir el archivo" });
    }
    next();
};
