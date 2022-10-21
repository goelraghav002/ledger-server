import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/user.js';
import Admin from '../models/admin.js';

export const createUser = async (req, res) => {
	const { name, username, email, password, contactNumber, admin } = req.body;

	let existingUser;

	const _admin = await Admin.findById( admin );

	try {
		existingUser = await User.findOne({ email });
	} catch (error) {
		return res.status(500).json({error});
	}

	if (existingUser) {
		return res.status(400).json({ message: 'User already redistered...!' });
	}

	const hashedPassword = bcrypt.hashSync(password, 10);

	const user = new User({
		name,
		username,
		email,
		password: hashedPassword,
		contactNumber,
		admin
	});

	try {

		const session = await mongoose.startSession();
		session.startTransaction();
		await user.save({ session });
		_admin.users.push(user);
		await _admin.save({ session });
		await session.commitTransaction();

	} catch (err) {
        return res.status(500).json({message: err});
    }

	return res.status(201).json({ message: 'User created successfully!', user });
	
};

export const getAdminUsers = async (req, res) => {
	let users;
	const adminId = req.params.id;
	try {
		users = await Admin.findById(adminId).populate('users');
	} catch (error) {
		return console.log(error);
	}

	if (!users) {
		return res.status(404).json({ message: 'No user found!' });
	}

	return res.status(200).json({ admin: users });
};

export const userSignin = async (req, res) => {
	const { email, password } = req.body;

	let existingUser;

	try {
		existingUser = await User.findOne({ email });
	} catch (error) {
		return console.log(error);
	}

	if (!existingUser) {
		return res.status(404).json({ message: 'User not registered...!' });
	}

	const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);

	if (!isPasswordCorrect) {
		return res.status(400).json({ message: 'Incorrect Password' });
	}

	const token = jwt.sign({ _id: existingUser._id }, process.env.SECRET_KEY, {
		expiresIn: '1h',
	});
	return res.status(200).json({ token, user: existingUser });
};
