import jwt from "jsonwebtoken";

const generarJWT = (id,nombre, rol)=>{
    return jwt.sign({id,nombre, rol},process.env.JWT_SECRET,{expiresIn:"1d"})
}

export default  generarJWT

