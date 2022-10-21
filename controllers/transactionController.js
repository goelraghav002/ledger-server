import mongoose from 'mongoose';

import Transaction from '../models/transaction.js';
import Admin from '../models/admin.js';
import Customer from '../models/customer.js';

export const addTransaction = async (req, res) => {
	const { note, admin, transactionType, customerName } = req.body;
	let { amount } = req.body;
	const customerId = req.params.id;

	let _admin;
	let customer;

	try {
		_admin = await Admin.findById(admin);
		customer = await Customer.findById(customerId);
	} catch (error) {
		return res.status(500).json({ error });
	}

	if (!_admin) {
		return res.status(400).json({ message: 'No admin found' });
	}
	if (!customer) {
		return res.status(400).json({ message: 'No customer found' });
    }
    
    if (_admin._id.toString() != customer.admin.toString()) {
        return res.status(400).json({ message: 'Customer not found in admin list' });
	}
	
	if (transactionType === 'payment') {
		amount = (-1 * amount);
	}
	customer.balance += amount;
	_admin.balance += amount;
	const transaction = new Transaction({
		amount,
		note: note ? note : '',
		admin,
		transactionType,
		customerName,
		customer: customerId,
	});


    try {
        
        const session = await mongoose.startSession();
        session.startTransaction();
        await transaction.save({ session });
        customer.transactions.push(transaction);
        _admin.transactions.push(transaction);
        await customer.save({ session });
        await _admin.save({ session });
        await session.commitTransaction();

	} catch (error) {
		return res.status(500).json({ error });
    }
    
    return res.status(201).json({ message: 'Transaction added', transaction });
};

export const getCustomerTransactions = async (req, res) => {
	const customerId = req.params.id;

	let transactions;

	try {
		transactions = await Customer.findById(customerId).populate('transactions');
	} catch (error) {
		return res.status(500).json({ error });
	}

	if (!transactions) {
		return res.status(404).json({ message: 'No transactions found!' });
	}

	return res.status(200).json({ customer: transactions });
}

export const getAdminTransactions = async (req, res) => {
	const adminId = req.params.id;

	let transactions;

	try {
		transactions = await Admin.findById(adminId).populate('transactions');
	} catch (error) {
		return res.status(400).json({ error });
	}

	if (!transactions) {
		return res.status(404).json({ message: 'No transactions found!' });
	}

	return res.status(200).json({ admin: transactions });
}