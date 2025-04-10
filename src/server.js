import express from 'express'
import morgan from 'morgan'
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

import routerAdmin from './routers/admin_routes.js'
import routerCliente from './routers/cliente_routes.js'
import routerProducto from './routers/producto_routes.js'
import routerCategoria from './routers/categoria_routes.js'
import routerVenta from './routers/venta_routes.js'
import { createAdmin } from './controllers/admin_controller.js';

const app = express()
// Configuración específica para desarrollo utilizando dotenv
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

app.use(morgan('dev'))

app.use(bodyParser.json());

app.set('port',process.env.port || 3000)
app.use(cors())

app.use(express.json())

createAdmin(); // Crear el admin por defecto al iniciar el servidor
app.use('/api',routerAdmin);
app.use('/api',routerCliente)
app.use('/api',routerProducto)
app.use('/api',routerCategoria)
app.use('/api',routerVenta)

// Rutas 
app.use((req,res)=>res.status(404).send("Endpoint no encontrado - 404"))
export default  app