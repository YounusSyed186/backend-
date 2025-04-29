import mongoose, { Schema } from 'mongoose'

const likesSchema = new Schema(
    {
        Comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweet",
        },
    },{timestamps:true}

)

export const Likes=mongoose.model("Likes",likesSchema)