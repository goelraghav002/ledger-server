import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import Admin from '../models/admin.js';

export const signup = async (req, res) => {
	const { name, username, email, password, contactNumber } = req.body;

	let existingUser;
	try {
		existingUser = await Admin.findOne({ email });
	} catch (error) {
		return console.log(error);
	}

	if (existingUser) {
		console.log(existingUser);
		return res.status(400).json({ message: 'Admin already redistered...!' });
	}

	const hashedPassword = bcrypt.hashSync(password, 10);

	const admin = new Admin({
		name,
		username,
		email,
		password: hashedPassword,
		contactNumber,
		users: [],
		customers: [],
		transactions: []
	});

	admin.save((err, data) => {
		if (err) {
			return res.status(400).json({ err });
		}
		if (data) {
			const { _id, name, username, email, contactNumber } = admin;

			return res
				.status(201)
				.json({
					message: 'Admin created Successfully!',
					admin: { _id, name, username, email, contactNumber },
				});
		}
	});
};

export const signin = async (req, res) => {
	const { email, password } = req.body;

	let admin;
	try {
		admin = await Admin.findOne({ email });
	} catch (error) {
		return console.log(error);
	}

	if (!admin) {
		return res.status(404).json({ message: 'Admin not registered!' });
	}

	const isPasswordCorrect = bcrypt.compareSync(password, admin.password);

	if (!isPasswordCorrect) {
		return res.status(400).json({ message: 'Incorrect Password' });
	}

	{
		const token = jwt.sign({ _id: admin._id }, process.env.SECRET_KEY, {
			expiresIn: '1h',
		});
		const { _id, name, username, email, contactNumber } = admin;
		res.cookie('token', token, { expiresIn: '1h' });

		return res
			.status(200)
			.json({ token, admin: { _id, name, username, email, contactNumber } });
	}
};

export const signout = (req, res) => {
	res.clearCookie('token');
	return res.status(200).json({ message: 'Signout Successfull' });
};

