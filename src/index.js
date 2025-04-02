import app from './server.js'
import connection from './database.js';
import http from 'http';


connection()

const server = http.createServer(app);

server.listen(app.get('port'),()=>{
    console.log(`Server ok on http://localhost:${app.get('port')}`);
})