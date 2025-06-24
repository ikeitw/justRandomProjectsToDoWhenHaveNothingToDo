const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { sequelize, Car, Buyer, Dealership } = require('./models');

app.get('/', (req, res) => {
    res.send('🚗 Car Sales API работает!');
});

const carRoutes = require('./routes/cars');
const buyerRoutes = require('./routes/buyers');
const dealershipRoutes = require('./routes/dealerships');
const matchRoutes = require('./routes/match');

app.use('/api/cars', carRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/dealerships', dealershipRoutes);
app.use('/api/match', matchRoutes);

sequelize.sync({ alter: true }).then(() => {
    console.log('✅ База данных синхронизирована');
    app.listen(process.env.PORT, () => {
        console.log(`🚀 Сервер запущен: http://localhost:${process.env.PORT}`);
    });
}).catch(err => {
    console.error('❌ Ошибка при подключении к базе данных:', err);
});
