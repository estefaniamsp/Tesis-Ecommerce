import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true, 
      trim: true, 
    },
    descripcion: {
      type: String,
      required: true,
      trim: true, 
    },
    imagen: {
      type: String,
      required: false, 
    },
    imagen_id: {
      type: String,
      required: false, 
    },
    
  },
  {
    timestamps: true, 
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.imagen_id; 
      },
    },
  }
);

const Categoria = mongoose.model('Categorias', categoriaSchema);

export default Categoria;
