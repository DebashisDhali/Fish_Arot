require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            password: String,
            role: String
        }));

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await User.findOneAndUpdate(
            { username: 'admin' },
            { password: hashedPassword, role: 'admin' },
            { upsert: true, new: true }
        );
        
        console.log('Admin password reset to: admin123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
