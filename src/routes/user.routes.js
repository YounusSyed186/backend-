import {Router} from 'express'  
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller.js'
import {upload} from "../middlewares/multer.js"
import { verifyJWT } from '../middlewares/auth.js'


const userRouter= Router()

userRouter.route("/register").post(
upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),
registerUser
)
userRouter.route("/login").post(loginUser)

//secure routes
userRouter.route("/logout").post(verifyJWT,logoutUser)

export default userRouter