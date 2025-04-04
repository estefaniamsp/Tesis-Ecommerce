import { check, validationResult } from "express-validator";

export const validarUsuario = [
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

    check("email")
        .isEmail()
        .withMessage('El campo "email" no es correcto.')
        .notEmpty()
        .withMessage('El campo "email" es obligatorio'),

    check("password")
        .isLength({ min: 8, max: 20 })
        .withMessage("La contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*).*$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula y un número.")
        .notEmpty()
        .withMessage('El campo "password" es obligatorio'),
];

// Validaciones para Clientes
export const validarCliente = [
    check("cedula")
        .isLength({ min: 10, max: 20 })
        .withMessage("La cédula debe tener entre 10 y 20 caracteres.")
        .notEmpty()
        .withMessage('El campo "cedula" es obligatorio'),

    check("nombre")
        .isLength({ min: 3, max: 20 })
        .withMessage("El nombre debe tener entre 3 y 20 caracteres.")
        .notEmpty()
        .withMessage('El campo "nombre" es obligatorio'),

    check("apellido")
        .isLength({ min: 3, max: 20 })
        .withMessage("El apellido debe tener entre 3 y 20 caracteres.")
        .notEmpty()
        .withMessage('El campo "apellido" es obligatorio'),

    check("ciudad")
        .isLength({ min: 3, max: 10 })
        .withMessage("La ciudad debe tener entre 3 y 10 caracteres.")
        .notEmpty()
        .withMessage('El campo "ciudad" es obligatorio'),

    check("email")
        .isEmail()
        .withMessage('El campo "email" no es correcto.')
        .notEmpty()
        .withMessage('El campo "email" es obligatorio'),

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

export const validarProducto = [
    check("nombre")
        .isLength({ min: 3, max: 100 })
        .withMessage("El nombre del producto debe tener entre 3 y 50 caracteres.")
        .notEmpty()
        .withMessage('El campo "nombre" es obligatorio'),

    check("descripcion")
        .isLength({ min: 5, max: 200 })
        .withMessage("La descripción debe tener entre 5 y 200 caracteres.")
        .notEmpty()
        .withMessage('El campo "descripcion" es obligatorio'),

    check("precio")
        .isDecimal()
        .withMessage("El precio debe ser un número decimal.")
        .notEmpty()
        .withMessage('El campo "precio" es obligatorio'),

    check("categoria")
        .isLength({ min: 3, max: 30 })
        .withMessage("La categoría debe tener entre 3 y 30 caracteres.")
        .notEmpty()
        .withMessage('El campo "categoria" es obligatorio'),

    check("cantidad")
        .isInt({ min: 1 })
        .withMessage("La cantidad debe ser un número entero mayor o igual a 1.")
        .notEmpty()
        .withMessage('El campo "cantidad" es obligatorio'),

    check("imagen_url")
        .optional()
        .isURL()
        .withMessage('El campo "imagen_url" debe ser una URL válida'),
];

export const validarCategoria = [
    check("nombre")
        .isLength({ min: 3, max: 50 })
        .withMessage("El nombre de la categoría debe tener entre 3 y 50 caracteres.")
        .notEmpty()
        .withMessage('El campo "nombre" es obligatorio'),

    check("descripcion")
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage("La descripción de la categoría debe tener entre 5 y 200 caracteres."),

    check("imagen_url")
        .optional()
        .isURL()
        .withMessage('El campo "imagen_url" debe ser una URL válida'),
];

export const validarVenta = [
    check("cliente_id")
        .isInt()
        .withMessage("El ID del cliente debe ser un número entero.")
        .notEmpty()
        .withMessage('El campo "cliente_id" es obligatorio'),

    check("fecha_venta")
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage("El formato de fecha debe ser YYYY-MM-DD.")
        .notEmpty()
        .withMessage('El campo "fecha_venta" es obligatorio'),

    check("productos")
        .isArray({ min: 1 })
        .withMessage("Debe haber al menos un producto en la venta.")
        .notEmpty()
        .withMessage('El campo "productos" es obligatorio'),

    check("productos.*.producto_id")
        .isInt()
        .withMessage("Cada producto debe tener un ID válido.")
        .notEmpty()
        .withMessage('El campo "producto_id" es obligatorio para cada producto'),

    check("productos.*.cantidad")
        .isInt({ min: 1 })
        .withMessage("La cantidad de cada producto debe ser un número entero mayor o igual a 1.")
        .notEmpty()
        .withMessage('El campo "cantidad" es obligatorio para cada producto'),

    check("total")
        .isDecimal()
        .withMessage("El total debe ser un número decimal.")
        .notEmpty()
        .withMessage('El campo "total" es obligatorio'),

    check("estado")
        .isIn(["pendiente", "completada", "cancelada"])
        .withMessage("El estado debe ser uno de los siguientes: 'pendiente', 'completada', 'cancelada'.")
        .notEmpty()
        .withMessage('El campo "estado" es obligatorio'),
];

export const validarFactura = [
    check("venta_id")
        .isInt()
        .withMessage("El ID de la venta debe ser un número entero.")
        .notEmpty()
        .withMessage('El campo "venta_id" es obligatorio'),

    check("fecha_factura")
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage("El formato de la fecha de la factura debe ser YYYY-MM-DD.")
        .notEmpty()
        .withMessage('El campo "fecha_factura" es obligatorio'),

    check("total")
        .isDecimal()
        .withMessage("El total de la factura debe ser un número decimal.")
        .notEmpty()
        .withMessage('El campo "total" es obligatorio'),

    check("estado")
        .isIn(["pendiente", "pagada", "anulada"])
        .withMessage("El estado debe ser uno de los siguientes: 'pendiente', 'pagada', 'anulada'.")
        .notEmpty()
        .withMessage('El campo "estado" es obligatorio'),

    check("descripcion")
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage("La descripción debe tener entre 5 y 200 caracteres."),
];

export const validarCarrito = [
    check("usuario_id")
        .isInt()
        .withMessage("El ID del usuario debe ser un número entero.")
        .notEmpty()
        .withMessage('El campo "usuario_id" es obligatorio'),

    check("productos")
        .isArray({ min: 1 })
        .withMessage("Debe haber al menos un producto en el carrito.")
        .notEmpty()
        .withMessage('El campo "productos" es obligatorio'),

    check("productos.*.producto_id")
        .isInt()
        .withMessage("Cada producto debe tener un ID válido.")
        .notEmpty()
        .withMessage('El campo "producto_id" es obligatorio para cada producto'),

    check("productos.*.cantidad")
        .isInt({ min: 1 })
        .withMessage("La cantidad de cada producto debe ser un número entero mayor o igual a 1.")
        .notEmpty()
        .withMessage('El campo "cantidad" es obligatorio para cada producto'),

    check("total")
        .isDecimal()
        .withMessage("El total debe ser un número decimal.")
        .notEmpty()
        .withMessage('El campo "total" es obligatorio'),

    check("estado")
        .isIn(["pendiente", "completado", "cancelado"])
        .withMessage("El estado debe ser uno de los siguientes: 'pendiente', 'completado', 'cancelado'.")
        .notEmpty()
        .withMessage('El campo "estado" es obligatorio'),
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
        .isLength({ min: 8, max: 20 })
        .withMessage("La contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*).*$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula y un número.")
        .notEmpty()
        .withMessage('El campo "password" es obligatorio'),
    
    check("nuevaPassword")
        .isLength({ min: 8, max: 20 })
        .withMessage("La nueva contraseña debe tener entre 8 y 20 caracteres.")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*).*$/)
        .withMessage("Debe contener al menos una mayúscula, una minúscula y un número.")
        .optional() // Esta validación solo es necesaria cuando se esté cambiando la contraseña
        .notEmpty()
        .withMessage('El campo "nuevaPassword" es obligatorio si deseas cambiar la contraseña'),

];

export const manejarErrores = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    } else {
        return res.status(400).json({ errors: errors.array() });
    }
};