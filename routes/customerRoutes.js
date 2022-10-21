import express from 'express';
import { createCustomer, deleteCustomer, getAdminCustomers, getCustomerById } from '../controllers/customerController.js';
import { requireSignin } from '../middlewares/index.js';
import { isRequestValidated, validateSignupRequest } from '../validators/auth.js';

const customerRouter = express.Router();

customerRouter.get('/all/:id', requireSignin, getAdminCustomers);
customerRouter.post('/add', validateSignupRequest, isRequestValidated, requireSignin, createCustomer);
customerRouter.delete('/delete/:id', requireSignin, deleteCustomer);
customerRouter.get('/:id', requireSignin, getCustomerById);

export default customerRouter;