import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import Customer from '../models/customer.js';
import Admin from '../models/admin.js';

export const createCustomer = async (req, res) => {
	const { name, username, email, password, contactNumber, admin } = req.body;

	let existingCustomer;
	let _admin;
	
	try {
		_admin = await Admin.findById(admin);
		existingCustomer = await Customer.findOne({ email });
	} catch (error) {
		return res.status(500).json({ error });
	}

	if (existingCustomer) {
		return res.status(400).json({ message: 'Customer already registered' });
	}

	const hashedPassword = bcrypt.hashSync(password, 10);

	const customer = new Customer({
		name,
		username,
		email,
		password: hashedPassword,
		contactNumber,
		admin,
	});

	try {
		const session = await mongoose.startSession();
		session.startTransaction();
		await customer.save({ session });
		_admin.customers.push(customer);
		await _admin.save({ session });
		await session.commitTransaction();
	} catch (error) {
		return res.status(500).json({ message: error });
	}

	return res
		.status(201)
		.json({ message: 'Customer created successfully!', customer });
};

export const getAdminCustomers = async (req, res) => {
	let customers;
	const adminId = req.params.id;
	try {
		customers = await Admin.findById(adminId).populate('customers').sort({created_at: -1});
	} catch (error) {
		return console.log(error);
	}

	if (!customers) {
		return res.status(404).json({ message: 'No customer found!' });
	}

	return res.status(200).json({ admin: customers });
};

export const deleteCustomer = async (req, res) => {
	const customerId = req.params.id;

	let customer;
	try {
		customer = await Customer.findByIdAndRemove(customerId).populate('admin');
		await customer.admin.customers.pull(customer);
		await customer.admin.save();
	} catch (error) {
		return res.status(500).json({ error });
	}

	if (!customer) {
		return res.status(500).json({ message: 'Unable to delete customer' });
	}
	return res.status(200).json({ message: 'Successfully Deleted' });
};

export const getCustomerById = async (req, res) => {
	const customerId = req.params.id;
	let customer;
	try {
		customer = await Customer.findById(customerId);
	} catch (err) {
		return res.status(400).json({ err });
	}
	if (!customer) {
		return res.status(404).json({ message: 'No customer found' });
	}
	return res.status(200).json({ customer });
};
