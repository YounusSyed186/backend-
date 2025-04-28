import { Router } from "express";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  getUserChanalProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
userRouter.route("/login").post(loginUser);

//secure routes
userRouter.route("/").get(verifyJWT, getCurrentUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/change-password").post(verifyJWT, changeCurrentUserPassword);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-details").patch(verifyJWT, updateAccountDetails);
userRouter
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("/avatar"), updateUserAvatar);
userRouter
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage);
userRouter.route("/c/:userName").get(verifyJWT, getUserChanalProfile);
userRouter.route("watch-history").get(verifyJWT, getWatchHistory);

export default userRouter;