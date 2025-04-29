import { check, body, validationResult } from "express-validator";

export const validarLoginAdmin = [
    check("email")
        .trim()
        .notEmpty().withMessage("El campo 'email' es obligatorio"),

    check("password")
        .trim()
        .isLength({ min: 8, max: 20 })
        .withMessage("La contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&).")
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
        .isLength({ min: 10, max: 20 })
        .withMessage("La cédula debe tener entre 10 y 20 caracteres.")
        .notEmpty()
        .withMessage('El campo "cedula" es obligatorio'),

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

    check("direccion")
        .isLength({ min: 5, max: 30 })
        .withMessage("La dirección debe tener entre 5 y 30 caracteres.")
        .notEmpty()
        .withMessage('El campo "direccion" es obligatorio'),

    check("telefono")
        .isLength({ min: 10, max: 10 })
        .withMessage("El teléfono debe tener exactamente 10 caracteres.")
        .isNumeric()
        .withMessage("El teléfono solo debe contener números.")
        .notEmpty()
        .withMessage('El campo "telefono" es obligatorio'),

    check("fecha_nacimiento")
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage("El formato debe ser YYYY-MM-DD.")
        .notEmpty()
        .withMessage('El campo "fecha_nacimiento" es obligatorio'),
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

    check("ingredientes")
        .custom((value, { req }) => {
            const ingredientes = Array.isArray(req.body.ingredientes)
                ? req.body.ingredientes
                : [req.body.ingredientes];

            if (ingredientes.length < 2) {
                throw new Error("Debes seleccionar al menos 2 ingredientes.");
            }
            return true;
        }),

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

    // Validación personalizada para beneficios (opcional, máximo 3 strings no vacíos)
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
        .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)
        .withMessage("El nombre solo debe contener letras y espacios.")
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

export const validarVenta = [
    check("productos")
        .isArray({ min: 1 })
        .withMessage("Debe haber al menos un producto en la venta.")
        .notEmpty()
        .withMessage('El campo "productos" es obligatorio'),

    check("productos.*.producto_id")
        .isMongoId()
        .withMessage("Cada producto debe tener un ID válido.")
        .notEmpty()
        .withMessage('El campo "producto_id" es obligatorio para cada producto'),

    check("productos.*.cantidad")
        .isInt({ min: 1 })
        .withMessage("La cantidad de cada producto debe ser un número entero mayor o igual a 1.")
        .notEmpty()
        .withMessage('El campo "cantidad" es obligatorio para cada producto'),
];

export const validarCarrito = [

    check("productos")
        .isArray({ min: 1 })
        .withMessage("Debe haber al menos un producto en el carrito.")
        .notEmpty()
        .withMessage('El campo "productos" es obligatorio'),

    check("productos.*.producto_id")
        .isMongoId()
        .withMessage("Cada producto debe tener un ID válido.")
        .notEmpty()
        .withMessage('El campo "producto_id" es obligatorio para cada producto'),

    check("productos.*.cantidad")
        .isInt({ min: 1 })
        .withMessage("La cantidad de cada producto debe ser un número entero mayor o igual a 1.")
        .notEmpty()
        .withMessage('El campo "cantidad" es obligatorio para cada producto'),
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
        .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres."),

    check("descripcion")
        .trim()
        .notEmpty().withMessage('El campo "descripcion" es obligatorio')
        .isLength({ min: 10, max: 500 }).withMessage("La descripción debe tener entre 10 y 500 caracteres."),

    check("fecha_inicio")
        .notEmpty().withMessage('El campo "fecha_inicio" es obligatorio')
        .isISO8601().withMessage("La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)."),

    check("fecha_fin")
        .notEmpty().withMessage('El campo "fecha_fin" es obligatorio')
        .isISO8601().withMessage("La fecha de fin debe ser una fecha válida (YYYY-MM-DD)."),

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
    check("descripcion")
      .optional()
      .isString().withMessage("La descripción debe ser un texto válido."),
    check("fechaInicio")
      .optional()
      .isISO8601().withMessage("La fecha de inicio debe ser válida."),
    check("fechaFin")
      .optional()
      .isISO8601().withMessage("La fecha de fin debe ser válida."),
  ];

export const manejarErrores = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    } else {
        return res.status(400).json({ errors: errors.array() });
    }
};