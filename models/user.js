import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const userSchema = new Schema({
	name: {
		type: String,
		trim: true,
		required: true,
		min: 3,
		max: 30,
	},
	username: {
		type: String,
		trim: true,
		unique: true,
		required: true,
		min: 3,
		max: 30,
	},
	email: {
		type: String,
		trim: true,
		unique: true,
		required: true,
		min: 3,
		max: 30,
	},
	password: {
		type: String,
		trim: true,
		required: true,
		min: 6,
		max: 30,
	},
	contactNumber: {
		type: Number,
		trim: true,
		unique: true,
		required: true,
		min: 6000000000,
		max: 9999999999,
	},
	admin: {
		type: mongoose.Types.ObjectId,
		ref: 'Admin',
		required: true,
	},
	created_at: {
		type: Date,
		required: true,
		default: Date.now,
	},
});

export default mongoose.model('User', userSchema);
