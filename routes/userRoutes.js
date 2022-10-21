import express from 'express';

import { createUser, getAdminUsers, userSignin } from '../controllers/userController.js';
import { requireSignin } from '../middlewares/index.js';
import { isRequestValidated, validateSigninRequest, validateSignupRequest } from '../validators/auth.js';

const userRouter = express.Router();

userRouter.get('/all/:id', requireSignin, getAdminUsers);
userRouter.post('/signup/:id', validateSignupRequest, isRequestValidated, requireSignin, createUser);
userRouter.post('/signin', validateSigninRequest, isRequestValidated, userSignin);

export default userRouter;