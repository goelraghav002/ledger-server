import mongoose from 'mongoose';
import nd from './time.js';

const Schema = mongoose.Schema;

const transactionSchema = new Schema({
	amount: {
		type: Number,
		reqtured: true,
		trim: true,
		max: 9999999,
	},
	note: {
		type: String,
        trim: true,
	},
	transactionType: {
		type: String,
		requred: true,
	},
    admin: {
		type: mongoose.Types.ObjectId,
		ref: 'Admin',
		required: true,
	},
    customer: {
		type: mongoose.Types.ObjectId,
		ref: 'Customers',
		required: true,
	},
    customerName: {
		type: String,
		ref: 'Customers',
		required: true,
	},
    created_at: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

export default mongoose.model('Transaction', transactionSchema);