const mongoose = require("mongoose")

const subsSchema = new mongoose.Schema([
    {
        subscriber:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    }
],{timestamps:true})

const Subscriptions = mongoose.model("Subscription",subsSchema)

module.exports = {Subscriptions}