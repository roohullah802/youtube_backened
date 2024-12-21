const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary url
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        },
        password: {
            type: String,
            required: [true, "password is required"]
        },
        refreshToken: {
            type: String,
        }
    }, { timestamps: true }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()

    const hashPassword = await bcrypt.hash(this.password, 10)
    this.password = hashPassword
    next()

})

userSchema.methods.isPasswordCorrect = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password)
}

userSchema.methods.generateAccessToken = async function () {
  return  jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    }, process.env.ACCESS_TOKEN_SECRET,{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = async function () {
   return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET,{expiresIn:process.env.REFRESH_TOKEN_EXPIRY})
}


const UserModel = mongoose.model("User", userSchema)

module.exports = UserModel