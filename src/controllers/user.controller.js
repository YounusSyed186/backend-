import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: true })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong whil Access And refresh token")
    }
}

const registerUser = asyncHandler(async (req, res, next) => {
    console.log("REQ.FILES:", req.files);
    console.log("REQ.BODY:", req.body);

    const { fullName, email, userName, password } = req.body;

    if (!email || !fullName || !userName || !password) {
        throw new ApiError(400, "All fields (email, fullName, userName, password) are required");
    }

    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    });
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Check for avatar file
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Check for cover image file (optional)
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

    // Upload files to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(409, "Avatar file upload failed");
    }

    // Create the user in the database
    const user = await User.create({
        fullName,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // Provide a default value if no cover image
        password,
        userName: userName.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res, next) => {
    //Take Email And Password
    //Check if user Exist or not
    //if user Doesnt Exist nev to register
    //if user exist compair the password 
    //if password is correct generate access and refresh token 
    //send cookie 
    console.log("REQ_BODY", req.body)
    const { email, userName, password } = req.body

    //if email and password is their
    if (!(email || userName)) {
        throw new ApiError(400, "Email or userName are required")
    }
    //if user dosent exist
    const user = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (!user) {
        throw new ApiError(401, "User With this email or userName dosent Exist")
    }
    //if user exist check password
    const correctPassword = await user.isPasswordCorrect(password)
    if (!correctPassword) {
        throw new ApiError(402, "The given password dosent match with the email")
    }
    //if password correct generate access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    if (!accessToken || !refreshToken) {
        throw new ApiError(500, "Couldnt create Tokens")
    }
    //send cookies
    const loggedIN = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedIN, accessToken, refreshToken
                },
                "User loggedIn successfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    //clear cookies
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }

    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        //access from cookies
        const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorized request")
        }

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.SECRET_TOKEN
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, newRefreshToken }, "Access Token refreshed")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "oldPassword and newPassword are required")
        }
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
        if (!isPasswordCorrect) {
            throw new ApiError(400, "The given password is incorrect")
        }
        user.password = newPassword
        await user.save({ validateBeforeSave: false })
        return res.status(200).json(
            new ApiResponse(200, {}, "Password changed successfully")
        )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while changing the password")
    }


})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(200,
            req.user, "current user fetched successfully"
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    
    if (!fullName || !email) {
        throw new ApiError(401, "fullName or email field should not be empty")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            }
        },
        { new: true }

    ).select("-password")
    return res.status(200).json(
        new ApiResponse(200, user, "Account details updated successfully")
    )
})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLacalPath = req.file?.path
    if (!avatarLacalPath) {
        new ApiError(400, "avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLacalPath)
    if (!avatar.url) {
        new ApiError(400, "Error while uploading avatar")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")
    return res.status(200)
    .json(
        new ApiResponse(200,user,"avatar is uploaded successfully")
    )
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        new ApiError(400, "coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        new ApiError(400, "Error while uploading coverImage")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")
    return res.status(200)
    .json(
        new ApiResponse(200,user,"CoverImage is uploaded successfully")
    )
})


export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentUserPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};
