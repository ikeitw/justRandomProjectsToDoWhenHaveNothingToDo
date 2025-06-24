const { Op } = require('sequelize');
const Buyer = require('../models/Buyer');
const Car = require('../models/Car');

exports.buyersForCar = async (req, res) => {
    const car = await Car.findByPk(req.params.id);
    if (!car) return res.status(404).json({ error: 'Автомобиль не найден' });

    const where = {
        [Op.and]: [
            { maxPrice: { [Op.gte]: car.price } }
        ]
    };

    if (car.firm) {
        where[Op.and].push({
            [Op.or]: [
                { preferredFirm: { [Op.eq]: car.firm } },
                { preferredFirm: { [Op.is]: null } }
            ]
        });
    }

    if (car.model) {
        where[Op.and].push({
            [Op.or]: [
                { preferredModel: { [Op.eq]: car.model } },
                { preferredModel: { [Op.is]: null } }
            ]
        });
    }

    if (car.condition) {
        where[Op.and].push({
            [Op.or]: [
                { preferredCondition: { [Op.eq]: car.condition } },
                { preferredCondition: { [Op.is]: null } }
            ]
        });
    }

    const buyers = await Buyer.findAll({ where });

    console.log("📋 Условия запроса:");
    console.dir(where, { depth: null });

    console.log("👀 Найдено покупателей:", buyers.length);
    buyers.forEach(b => {
        console.log(
            `${b.fullName} — Цена: ${b.maxPrice}, Фирма: ${b.preferredFirm}, Модель: ${b.preferredModel}, Состояние: ${b.preferredCondition}`
        );
    });


    res.json(buyers);
};

exports.carsForBuyer = async (req, res) => {
    const buyer = await Buyer.findByPk(req.params.id);
    if (!buyer) return res.status(404).json({ error: 'Покупатель не найден' });

    const cars = await Car.findAll({
        where: {
            [Op.and]: [
                buyer.maxPrice ? { price: { [Op.lte]: buyer.maxPrice } } : {},
                buyer.preferredFirm ? { firm: buyer.preferredFirm } : {},
                buyer.preferredModel ? { model: buyer.preferredModel } : {},
                buyer.preferredCondition ? { condition: buyer.preferredCondition } : {}
            ]
        },
        include: ['Dealership']
    });

    res.json(cars);
};

