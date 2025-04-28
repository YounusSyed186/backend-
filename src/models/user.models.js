import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

const userSchama = new Schema(
    {

        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            },

        ],
        userName: {
            type: String,
            require: true,
            unique: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            require: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,//cloudinary url
            require: true,
        },
        coverImage: {
            type: String,//cloudinary url
        },
        password: {
            type: String,
            req: [true, 'password is required']
        },
        refreshToken: {
            type: String,
        }

    }, { timestamps: true }
)
userSchama.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
userSchama.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
userSchama.methods.generateAccessToken=async function(){
    return jwt.sign(
        {
            _id:this.id,
            email:this.email,
            username:this.username,
            fullName:this.fullName

        },
        process.env.SECRET_TOKEN,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchama.methods.generateRefreshToken=async function(){
    return jwt.sign(
        {
            _id:this.id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_SECRET_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchama)