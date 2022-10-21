import mongoose from "mongoose";
import nd from "./time.js";

const Schema = mongoose.Schema;

const adminSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        minlength: 3,
        maxlength: 30,
    },
    username: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        minlength: 3,
        maxlength: 30,
    },
    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 6,
    },
    contactNumber: {
        type: Number,
        trim: true,
        unique: true,
        required: true,
        min: 6000000000,
        max: 9999999999,
    },
    balance: {
		type: Number,
		required: true,
		default: 0
	},
    users: [{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    customers: [{
        type: mongoose.Types.ObjectId,
        ref: 'Customer',
        required: true,
    }],
    transactions: [{
        type: mongoose.Types.ObjectId,
        ref: 'Transaction',
        required: true,
    }],
    created_at: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

export default mongoose.model('Admin', adminSchema);