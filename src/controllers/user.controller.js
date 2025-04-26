import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

export { registerUser };
