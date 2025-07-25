import { check, body, validationResult } from "express-validator";

export const validarLogin = [
    check("email")
        .trim()
        .notEmpty().withMessage("El campo 'email' es obligatorio"),

    check("password")
        .trim()
        .notEmpty()
        .withMessage("El campo 'password' es obligatorio")
];

export const validarCambioContraseniaAdmin = [
    check("email")
        .trim()
        .notEmpty().withMessage("El campo 'email' es obligatorio"),

    check("nuevaPassword")
        .trim()
        .isLength({ min: 8, max: 20 })
        .withMessage("La contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).")
        .notEmpty()
        .withMessage("El campo 'password' es obligatorio"),

    check("codigoRecuperacion")
        .trim()
        .notEmpty().withMessage("El campo 'codigoRecuperacion' es obligatorio")
        .isLength({ min: 6, max: 6 }).withMessage("El código de recuperación debe tener 6 caracteres.")
        .isNumeric().withMessage("El código de recuperación solo debe contener números.")
];

export const validarCliente = [

    check("nombre")
        .isLength({ min: 3, max: 30 })
        .withMessage("El nombre debe tener entre 3 y 30 caracteres.")
        .isAlpha("es-ES", { ignore: "áéíóúÁÉÍÓÚñÑ " })
        .withMessage("El nombre solo debe contener letras.")
        .notEmpty()
        .withMessage('El campo "nombre" es obligatorio'),

    check("apellido")
        .isLength({ min: 3, max: 20 })
        .withMessage("El apellido debe tener entre 3 y 20 caracteres.")
        .isAlpha("es-ES", { ignore: "áéíóúÁÉÍÓÚñÑ " })
        .withMessage("El apellido solo debe contener letras.")
        .notEmpty()
        .withMessage('El campo "apellido" es obligatorio'),

    check("genero")
        .isLength({ min: 4, max: 10 })
        .withMessage("El género debe tener entre 4 y 10 caracteres.")
        .isAlpha("es-ES", { ignore: "áéíóúÁÉÍÓÚñÑ " })
        .withMessage("El género solo debe contener letras.")
        .notEmpty()
        .withMessage('El campo "genero" es obligatorio'),

    check("email")
        .isEmail()
        .withMessage('El campo "email" no es correcto.')
        .notEmpty()
        .withMessage('El campo "email" es obligatorio'),

    check("password")
        .trim()
        .isLength({ min: 8, max: 20 })
        .withMessage("La contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).")
        .notEmpty()
        .withMessage("El campo 'password' es obligatorio")
];

export const validarClientePerfil = [
    check("cedula")
        .optional()
        .isLength({ min: 10, max: 10 })
        .withMessage("La cédula debe tener exactamente 10 dígitos.")
        .isNumeric()
        .withMessage("La cédula solo debe contener números."),

    check("nombre")
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage("El nombre debe tener entre 3 y 30 caracteres.")
        .isAlpha("es-ES", { ignore: "áéíóúÁÉÍÓÚñÑ " })
        .withMessage("El nombre solo debe contener letras."),

    check("apellido")
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage("El apellido debe tener entre 3 y 20 caracteres.")
        .isAlpha("es-ES", { ignore: "áéíóúÁÉÍÓÚñÑ " })
        .withMessage("El apellido solo debe contener letras."),

    check("genero")
        .optional()
        .isIn(["masculino", "femenino"])
        .withMessage("El género debe ser 'masculino' o 'femenino'."),

    check("direccion")
        .optional()
        .isLength({ min: 5, max: 50 })
        .withMessage("La dirección debe tener entre 10 y 50 caracteres."),

    check("telefono")
        .optional()
        .isLength({ min: 10, max: 10 })
        .withMessage("El teléfono debe tener exactamente 10 dígitos.")
        .isNumeric()
        .withMessage("El teléfono solo debe contener números."),

    check("fecha_nacimiento")
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage("La fecha de nacimiento debe tener el formato YYYY-MM-DD."),
];

export const validarCambioContraseniaCliente = [
    check("email")
        .trim()
        .notEmpty().withMessage("El campo 'email' es obligatorio")
        .isEmail().withMessage("El correo ingresado no es válido"),

    check("nuevaPassword")
        .trim()
        .notEmpty().withMessage("El campo 'nuevaPassword' es obligatorio")
        .isLength({ min: 8, max: 20 })
        .withMessage("La nueva contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage("La nueva contraseña debe contener una mayúscula, una minúscula, un número y un carácter especial."),

    check("codigoRecuperacion")
        .notEmpty().withMessage("El campo 'codigoRecuperacion' es obligatorio")
        .isNumeric().withMessage("El código de recuperación debe ser un número")
        .isLength({ min: 6, max: 6 })
        .withMessage("El código de recuperación debe tener exactamente 6 dígitos"),
];

export const validarProducto = [
    check("nombre")
        .isLength({ min: 3, max: 100 })
        .withMessage("El nombre del producto debe tener entre 3 y 50 caracteres.")
        .notEmpty()
        .withMessage('El campo "nombre" es obligatorio'),

    check("descripcion")
        .isLength({ min: 5, max: 500 })
        .withMessage("La descripción debe tener entre 5 y 500 caracteres.")
        .notEmpty()
        .withMessage('El campo "descripcion" es obligatorio'),

    check("precio")
        .isDecimal()
        .withMessage("El precio debe ser un número decimal.")
        .notEmpty()
        .withMessage('El campo "precio" es obligatorio'),

    check("stock")
        .notEmpty().withMessage('El campo "stock" es obligatorio')
        .isInt({ min: 0 })
        .withMessage("El stock debe ser un número entero igual o mayor a 0."),

    check("aroma")
        .notEmpty()
        .withMessage("El aroma es obligatorio."),

    check("tipo")
        .notEmpty()
        .withMessage("El tipo de piel es obligatorio."),

    check("descuento")
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage("El descuento debe ser un número entre 0 y 100."),

    check("id_categoria")
        .notEmpty().withMessage('El campo "id_categoria" es obligatorio')
        .isMongoId()
        .withMessage("El id de la categoría debe ser un ObjectId válido."),

    body("beneficios")
        .optional()
        .isArray({ max: 3 }).withMessage("Solo se permiten hasta 3 beneficios.")
        .custom((array) => {
            if (!array.every((item) => typeof item === "string" && item.trim() !== "")) {
                throw new Error("Todos los beneficios deben ser textos no vacíos.");
            }
            return true;
        }),

    body("imagen")
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error("La imagen es obligatoria");
            }
            return true;
        }),
];

export const validarCategoria = [
    check("nombre")
        .isLength({ min: 3, max: 50 })
        .withMessage("El nombre de la categoría debe tener entre 3 y 50 caracteres.")
        .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/)
        .withMessage("El nombre solo debe contener letras, numeros y espacios.")
        .notEmpty()
        .withMessage('El campo "nombre" es obligatorio'),

    check("descripcion")
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage("La descripción de la categoría debe tener entre 5 y 200 caracteres."),

    body("imagen")
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error("La imagen es obligatoria");
            }
            return true;
        }),
];

export const validarCarrito = [

    check("producto_id")
        .isMongoId()
        .withMessage("El campo producto_id debe ser un ID válido.")
        .notEmpty()
        .withMessage("El campo producto_id es obligatorio"),

    check("cantidad")
        .isInt({ min: 1 })
        .withMessage("La cantidad debe ser un número entero mayor o igual a 1.")
        .notEmpty()
        .withMessage("El campo cantidad es obligatorio"),
];

export const validarModificarCantidad = [
    check("producto_id")
        .notEmpty()
        .withMessage("El campo producto_id es obligatorio.")
        .isMongoId()
        .withMessage("El producto_id debe ser un ID válido."),

    check("cantidad")
        .notEmpty()
        .withMessage("El campo cantidad es obligatorio.")
        .isInt()
        .withMessage("La cantidad debe ser un número entero (positivo o negativo)."),

];

// Validación para que solo el admin pueda cambiar o recuperar su contraseña
export const validarAdmin = [
    check("usuario")
        .isEmail()
        .withMessage('El campo "usuario" debe ser un correo electrónico válido.')
        .notEmpty()
        .withMessage('El campo "usuario" es obligatorio')
        .custom(async (value) => {
            // Verificar si el usuario es el admin
            const admin = await Admin.findOne({ usuario: value });
            if (!admin) {
                throw new Error("Este usuario no es un administrador válido.");
            }
            return true;
        }),

    check("password")
        .trim()
        .isLength({ min: 8, max: 20 })
        .withMessage("La contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).")
        .notEmpty()
        .withMessage("El campo 'password' es obligatorio"),

    check("nuevaPassword")
        .trim()
        .isLength({ min: 8, max: 20 })
        .withMessage("La contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).")
        .notEmpty()
        .withMessage("El campo 'password' es obligatorio"),

];

export const validarPromocion = [
    check("nombre")
        .trim()
        .notEmpty().withMessage('El campo "nombre" es obligatorio')
        .isLength({ min: 3, max: 30 }).withMessage("El nombre debe tener entre 3 y 30 caracteres."),

    body("imagen")
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error("La imagen es obligatoria");
            }
            return true;
        }),
];

export const validarActualizarPromocion = [
    check("nombre")
        .optional()
        .isString().withMessage("El nombre debe ser un texto válido."),
];

export const validarIngrediente = [
    check("nombre")
        .isLength({ min: 3, max: 50 })
        .withMessage("El nombre del ingrediente debe tener entre 3 y 50 caracteres.")
        .notEmpty()
        .withMessage('El campo "nombre" es obligatorio'),

    check("stock")
        .isInt({ min: 0 })
        .withMessage("El stock debe ser un número entero mayor o igual a 0.")
        .notEmpty()
        .withMessage('El campo "stock" es obligatorio'),

    check("precio")
        .isDecimal()
        .withMessage("El precio debe ser un número decimal.")
        .notEmpty()
        .withMessage('El campo "precio" es obligatorio'),

    check("tipo")
        .notEmpty()
        .withMessage('El campo "tipo" es obligatorio')
        .isLength({ min: 3, max: 20 })
        .withMessage("El tipo debe tener entre 3 y 20 caracteres.")
        .isAlpha("es-ES", { ignore: "áéíóúÁÉÍÓÚñÑ " })
        .withMessage("El tipo solo debe contener letras."),

    body("imagen")
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error("La imagen es obligatoria");
            }
            return true;
        }),
]

export const manejarErrores = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    } else {
        return res.status(400).json({ msg: "Error de validación de datos. Por favor, revisa los campos enviados.", details: errors.array() });
    }
};