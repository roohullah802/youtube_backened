// Import Mongoose
const mongoose = require('mongoose');

// MongoDB connection URL
const dbURI = 'mongodb://localhost:27017/youtubeData'; // Change this if using MongoDB Atlas

// Connect to MongoDB using Mongoose
const connectDB = ()=>{
     mongoose.connect(dbURI, {
        useNewUrlParser: true,  // To avoid deprecation warning
        useUnifiedTopology: true,  // For more stable connection handling
    })
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    })

}

module.exports = {connectDB}