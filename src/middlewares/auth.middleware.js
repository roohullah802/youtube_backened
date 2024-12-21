const jwt = require("jsonwebtoken")
require("dotenv").config()
const UserModel = require("../models/user.model")

const verifyToken = async(req,res,next)=>{

    try {
        const token = req.headers.authorization.split(" ")[1]
    
        if (!token) {
           return res.status(400).json("Unauthorized access")
        }
    
        const decode = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        if (!decode) {
           return res.status(401).json("token not valid")
        }

        const user = await UserModel.findById(decode._id)

        req.user = user

        next()
    
    } catch (error) {
        res.status(500).json("token not found")
    }
}

module.exports = {verifyToken}