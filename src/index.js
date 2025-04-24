// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js';
dotenv.config({
    path: './env'
});
const Port = process.env.PORT || 8000

connectDB()
try {
    app.listen(Port, () => {
        console.log(`Server is running at Port : http://localhost:${Port}`)
    })
} catch (error) {
    console.log("MongoDB connection Failed", error)
}


// .then(()=>{
//     app.listen(Port,()=>{
//         console.log(`Server is running at Port : http://localhost:${Port}`)
//     })
// })
// .catch((err)=>{
//     console.log("MONGO db connection failed", err)
// })







// import express from 'express'
// const app=express()
// ;(async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERROR",error)
//             throw error
//         })
//         app.listen(process.env.MONGODB_URI, ()=>{
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("ERROR:",error)
//         throw error
//     }
// })