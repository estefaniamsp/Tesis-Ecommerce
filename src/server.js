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
import routerCarrito from './routers/carrito_routes.js'
import routerPromocion from './routers/promocion_routes.js'
import routerAuth from './routers/auth_routes.js'
import routerIngrediente from './routers/ingrediente_routes.js'
import routerProductoPersonalizado from './routers/productoPersonalizado_routes.js'
import routerVistaProducto from './routers/vistaProducto_routes.js'
import routerNotificacion from './routers/notificacion_routes.js'
import { createAdmin } from './controllers/admin_controller.js';

const app = express()
// Configuración específica para desarrollo utilizando dotenv
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

app.use(morgan('dev'))

app.use(bodyParser.json());

app.set('port', process.env.port || 3000)
app.use(cors())

app.use(express.json())

createAdmin(); // Crear el admin por defecto al iniciar el servidor
app.use('/api', routerAdmin);
app.use('/api', routerCliente)
app.use('/api', routerProducto)
app.use('/api', routerCategoria)
app.use('/api', routerVenta)
app.use('/api', routerCarrito)
app.use('/api', routerPromocion)
app.use('/api', routerIngrediente)
app.use('/api', routerProductoPersonalizado)
app.use('/api', routerVistaProducto)
app.use('/api', routerNotificacion)
app.use('/api', routerAuth)

// Rutas 
app.get('/', (req, res) => {
    res.send(`
    <html>
      <head>
        <title>Flor & Cera - API</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #fdf6ff;
            color: #333;
            margin: 0;
            padding: 0;
            line-height: 1.6;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 60px 30px;
            text-align: justify;
          }
          h1 {
            text-align: center;
            font-size: 28px;
            color: #6b4ea0;
            margin-bottom: 30px;
          }
          h2 {
            text-align: center;
            font-size: 22px;
            color: #7f5aa8;
            margin-bottom: 20px;
          }
          p {
            font-size: 17px;
            color: #444;
            margin-bottom: 18px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 14px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>DESARROLLO DE UN E-COMMERCE PARA LA VENTA DE PRODUCTOS ARTESANALES PERSONALIZADOS BASADO EN IA</h1>
          
          <p>
            <strong>Flor&Cera</strong> es un emprendimiento dedicado a la elaboración de productos artesanales como jabones, aromatizantes y velas, utilizando ingredientes naturales y ecológicos con el propósito de promover el cuidado del medio ambiente.
          </p>
          
          <p>
            Actualmente, el emprendimiento busca brindar una interacción más satisfactoria al momento de adquirir sus productos mediante estrategias que resalten el valor de sus productos naturales y personalizados. Sin embargo, enfrenta la problemática de no contar con una plataforma tecnológica para comercializar sus productos, ya que solo dispone de un punto de venta físico. Esta limitación reduce su alcance y visibilidad en el mercado, lo cual representa una oportunidad para proponer una solución tecnológica que optimice su presencia digital y mejore su competitividad.
          </p>

          <p>
            Con el objetivo de fortalecer el emprendimiento, el presente proyecto de Integración Curricular ha desarrollado un backend para gestionar la venta de productos artesanales. Además, este componente incluye un modelo de Inteligencia Artificial (IA) que permite a los clientes personalizar sus productos según sus preferencias, generando así experiencias únicas. De esta manera, la personalización no solo añade valor al usuario, sino que también posiciona al emprendimiento como un negocio innovador dentro del sector.
          </p>

          <h2>API RESTful de Flor&Cera</h2>
          <p>
            Bienvenido a la API RESTful del sistema de comercio electrónico artesanal de jabones y velas. Puedes utilizar herramientas como Postman o una app cliente para consumir los endpoints disponibles.
          </p>

          <div class="footer">
            Desarrollado con Node.js, Express y MongoDB.
          </div>
        </div>
      </body>
    </html>
  `);
});

app.use((req, res) => {
    res.status(404).send(`
    <html>
      <head>
        <title>Error 404 - No encontrado</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #fdf0f8;
            color: #444;
            text-align: center;
            padding: 60px;
          }
          h1 {
            font-size: 72px;
            color: #d96b9a;
            margin-bottom: 10px;
          }
          h2 {
            color: #af4f7d;
            margin-bottom: 20px;
          }
          p {
            font-size: 18px;
            color: #666;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            color: #6b4ea0;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>404</h1>
        <h2>Oops, página no encontrada</h2>
        <p>La ruta solicitada no existe o fue movida.</p>
        <a href="/">Volver a inicio</a>
      </body>
    </html>
  `);
});

export default app