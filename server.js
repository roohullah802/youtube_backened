const express = require("express");
const app = express()
require("dotenv").config()
const userRouter = require("./src/routes/user.routes")
const {connectDB} = require("./src/db/mongodb")
const cookieParser = require("cookie-parser")
connectDB()


app.use(express.json({limit:"100kb"}))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use("/user",userRouter)




app.listen(process.env.PORT,()=>{
    console.log(`server is started at ${process.env.PORT}`);
})





