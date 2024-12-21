// Require the Cloudinary library
const cloudinary = require('cloudinary').v2
require("dotenv").config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;

        const response = await cloudinary.uploader.upload(filePath, { resource_type: "auto" })
        console.log("file uploaded on cloudinary");

        return response


    } catch (error) {
        console.log("error occured while uploading the file on cloudinary");
    }
}

module.exports = { uploadOnCloudinary }