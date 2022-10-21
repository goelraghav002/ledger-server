import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import env from 'dotenv';
import userRouter from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import customerRouter from './routes/customerRoutes.js';
import transactionRouter from './routes/transactionRoutes.js';

const app = express();

// app.use(bodyParser.json({ limit: '30mb', extended: true }));
// app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

app.use(cors());
app.use(express.json());
env.config();

// Routes
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customer', customerRouter);
app.use('/api/transaction', transactionRouter)


// connection to db
const PORT = process.env.PORT;

const URL = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.rbjgnyf.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`;

mongoose
	.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() =>
		app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))
	)
	.catch((err) => console.log(`${err} cannot connect`));
