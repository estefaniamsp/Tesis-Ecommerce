// Este script se utiliza para insertar un administrador en la base de datos MongoDB
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from './src/models/administrador.js'; 

const insertAdmin = async () => {
  try {
    await mongoose.connect('mongodb+srv://estefania01:tesis2025@cluster0.avgt4.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });

    const hashedPassword = bcrypt.hashSync("admin123", 10);

    const admin = new Admin({
      usuario: "admin@gmail.com",
      password: hashedPassword
    });

    await admin.save();

    console.log('✅ Administrador insertado en la colección "admins" de la base "test"');
  } catch (error) {
    console.error('❌ Error insertando admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

insertAdmin();
