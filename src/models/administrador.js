import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AdminSchema = new mongoose.Schema({
  usuario: {
    type: String,
    required: true,
    default: "admin@gmail.com", 
  },
  password: {
    type: String,
    required: true,
    default: async function () {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash("admin123", salt); 
    },
  },
});

// Método para comparar contraseñas
AdminSchema.methods.compararPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Admin = mongoose.model("Admin", AdminSchema);
export default Admin;
