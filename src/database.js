//Importar mongoose
import mongoose from 'mongoose'
import Clientes from './models/clientes.js';
import Admin from './models/administrador.js';
import Carrito from './models/carritos.js';
import Producto from './models/productos.js';
import Promocion from './models/promociones.js';
import Venta from './models/ventas.js';
import Categoria from './models/categorias.js';


// Pertimitir que solo los campos definidos en el Schema sean almacenados
// enn la BDD
mongoose.set('strictQuery', true)


// Crear una función llamada connection()
const connection = async()=>{
    try {
        // Establecer al conexión con la BDD
        const {connection} = await mongoose.connect(process.env.MONGODB_URI)
        await Clientes.syncIndexes();
        await Admin.syncIndexes();
        await Carrito.syncIndexes();
        await Producto.syncIndexes();
        await Promocion.syncIndexes();
        await Venta.syncIndexes();
        await Categoria.syncIndexes();

        // Presentar la conexión en consola 
        console.log(`Database is connected on ${connection.host} - ${connection.port}`)
    
    } catch (error) {
        // Capturar Error en la conexión
        console.log(error);
    }
}


//Exportar la función
export default  connection