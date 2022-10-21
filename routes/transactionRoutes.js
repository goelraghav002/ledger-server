import express from "express";
import { addTransaction, getAdminTransactions, getCustomerTransactions } from "../controllers/transactionController.js";
import { requireSignin } from "../middlewares/index.js";

const transactionRouter = express.Router();

transactionRouter.post('/:id/add', requireSignin, addTransaction);
transactionRouter.get('/all/:id', requireSignin, getCustomerTransactions);
transactionRouter.get('/admin/all/:id', requireSignin, getAdminTransactions);

export default transactionRouter;