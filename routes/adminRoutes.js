import express from 'express';

import { signin, signup, signout } from '../controllers/adminController.js';
import { isRequestValidated, validateSigninRequest, validateSignupRequest } from '../validators/auth.js';

const adminRouter = express.Router();

// adminRouter.get('/all', getAllAdmins);
adminRouter.post('/signup', validateSignupRequest, isRequestValidated, signup);
adminRouter.post('/signin', validateSigninRequest, isRequestValidated, signin);
adminRouter.post('/signout', signout);

export default adminRouter;