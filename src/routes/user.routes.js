const router = require("express").Router()
const fs = require("fs")
const upload = require("../config/multer")
const { uploadOnCloudinary } = require("../config/cloudinary")
const UserModel = require("../models/user.model")
const { verifyToken } = require("../middlewares/auth.middleware")
const { default: mongoose } = require("mongoose")


// user registration router 
router.post("/register", upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
]), async (req, res) => {

    const { username, email, fullname, password } = req.body
    if ([username, email, fullname, password].some((fields) => fields?.trim() === "")) {
        return res.status(401).json("All fields are required")
    }

    const existingUser = await UserModel.findOne({
        $or: [{ username }, { email }]
    })

    if (existingUser) {
        return res.status(400).json("This user already exist!")
    }

    const avatarPath = req.files?.avatar[0]?.path
    const coverImagePath = req.files?.coverImage[0]?.path

    if (!avatarPath) {
        return res.status(400).json({ message: "Avatar image is required" });
    }

    if (!coverImagePath) {
        return res.status(400).json({ message: "Cover image is required" });
    }


    let avatar, coverImage;

    try {
        avatar = await uploadOnCloudinary(avatarPath);
    } catch (error) {
        return res.status(500).json({ message: "Error uploading avatar image to Cloudinary", error });
    }

    try {
        coverImage = await uploadOnCloudinary(coverImagePath);
    } catch (error) {
        return res.status(500).json({ message: "Error uploading cover image to Cloudinary", error });
    }


    const response = await UserModel.create({
        username,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        fullname,
        password
    })

    const newUser = await response.save()
    res.status(201).json({
        message: "User created successfully",
        newUser
    })


})



// user login router
router.post("/login", async (req, res) => {
    const { username, email, password } = req.body

    if (!email && !username) {
        return res.status(400).json("email or username is required")
    }



    const userData = await UserModel.findOne({
        $or: [{ email, username }]
    })

    if (!userData) {
        return res.status(401).json("User not found")
    }

    const isPasswordValid = await userData.isPasswordCorrect(password)

    if (isPasswordValid) {

        const user = await UserModel.findById(userData._id);

        const AccessToken = await user.generateAccessToken()
        const RefreshToken = await user.generateRefreshToken()


        user.refreshToken = RefreshToken
        await user.save()

        return res
            .status(200)
            .cookie("accessToken", AccessToken, { httpOnly: true, secure: true })
            .cookie("refreshToken", RefreshToken, { httpOnly: true, secure: true })
            .json({ message: "User login successfully", AccessToken })

    } else {
        res.status(401).json("User invalid credientials")
    }


})

// user logout router
router.post("/logout", verifyToken, async (req, res) => {

    await UserModel.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined }
    })

    return res
        .status(200)
        .clearCookie("accessToken", { httpOnly: true, secure: true })
        .clearCookie("refreshToken", { httpOnly: true, secure: true })
        .json("user logged out")

})



// user password updation router
router.patch("/user-password-update", verifyToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await UserModel.findById(req.user._id);

    if (!user) {
        return res.status(400).json("User not found")
    }

    const passwordRef = await user.isPasswordCorrect(oldPassword)

    if (passwordRef) {
        user.password = newPassword
        await user.save()

        return res.status(200).json("User password successfully changed")
    } else {
        return res.status(400).json("User password incorrect")
    }
})




// user avatar image updation router
router.patch("/user-avatar-update", upload.single("avatar"), verifyToken, async (req, res) => {
    const avatarPath = req.file?.path;

    const avatar = await uploadOnCloudinary(avatarPath)

    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { avatar: avatar.url }
    )

    if (!user) {
        return res.status(400).json("User not found")
    }

    return res.status(200).json("Avatar Image changed")


})



// user cover Image updation router
router.patch("/user-coverImage-update", upload.single("coverImage"), verifyToken, async (req, res) => {
    const coverImagePath = req.file?.path;

    const coverImage = await uploadOnCloudinary(coverImagePath)

    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { coverImage: coverImage.url }
    )

    if (!user) {
        return res.status(400).json("User not found")
    }

    return res.status(200).json("cover Image changed")

})



// user profileDetails router
router.get("/profileDetails/:username", verifyToken, async (req, res) => {
    const { username } = req.params
    if (!username) {
        return res.status(400).json("username is missing")
    }

    const details = await UserModel.aggregate([
        {
            $match: { username: username }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscriptions.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                email: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if (!details?.length) {
        return res.status(400).json("channel does not exists!")
    }

    return res.status(200).json({
        message: "User profile details fetched",
        details
    })
})





// user videos watchHistory router
router.get("/watchHistory", verifyToken, async (req, res) => {
    const user = await UserModel.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        email: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            $first: "$owner"
                        }
                    }
                ]
            }
        }
    ])

    if (!user) {
        return res.status(400).json("no history")
    }

    return res.status(200).json({
        message: "watch History fetched seccessfully",
        user
    })
})




module.exports = router