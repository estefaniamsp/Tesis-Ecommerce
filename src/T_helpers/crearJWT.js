import jwt from "jsonwebtoken";

const generarJWT = (id,nombre)=>{
    return jwt.sign({id,nombre},process.env.JWT_SECRET,{expiresIn:"1d"})
}

const generarJWTSinCaducidad = (id, nombre) => {
  return jwt.sign({ id, nombre }, process.env.JWT_SECRET);
};

export {
    generarJWT,
    generarJWTSinCaducidad
}



