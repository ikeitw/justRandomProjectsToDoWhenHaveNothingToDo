const { sequelize, Car, Buyer, Dealership } = require('./models');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log("🔄 Таблицы пересозданы");

        const autoGrad = await Dealership.create({ name: 'АвтоГрад' });
        const premiumAuto = await Dealership.create({ name: 'ПремиумАвто' });

        await Car.bulkCreate([
            {
                firm: 'Toyota',
                model: 'Camry',
                year: 2022,
                enginePower: 200,
                transmission: 'АКП',
                condition: 'новая',
                mileage: 0,
                features: 'кожаный салон',
                price: 25000,
                DealershipId: autoGrad.id
            },
            {
                firm: 'BMW',
                model: '3 Series',
                year: 2018,
                enginePower: 250,
                transmission: 'МКП',
                condition: 'с пробегом',
                mileage: 29000,
                features: 'спорт пакет',
                price: 22000,
                DealershipId: premiumAuto.id
            },
            {
                firm: 'Kia',
                model: 'Rio',
                year: 2020,
                enginePower: 120,
                transmission: 'АКП',
                condition: 'с пробегом',
                mileage: 15000,
                features: 'кондиционер',
                price: 15000,
                DealershipId: autoGrad.id
            }
        ]);

        await Buyer.bulkCreate([
            {
                fullName: 'Иван Иванов',
                contactInfo: 'ivan@example.com',
                preferredFirm: 'Toyota',
                preferredModel: null,
                preferredYear: 2020,
                preferredPower: 150,
                preferredTransmission: 'АКП',
                preferredCondition: 'новая',
                maxPrice: 26000
            },
            {
                fullName: 'Петр Петров',
                contactInfo: 'petr@example.com',
                preferredFirm: null,
                preferredModel: '3 Series',
                preferredYear: null,
                preferredPower: null,
                preferredTransmission: 'МКП',
                preferredCondition: 'с пробегом',
                maxPrice: 23000
            },
            {
                fullName: 'Ольга Смирнова',
                contactInfo: 'olga@example.com',
                preferredFirm: 'Kia',
                preferredModel: null,
                preferredYear: null,
                preferredPower: null,
                preferredTransmission: null,
                preferredCondition: null,
                maxPrice: 16000
            },
            {
                fullName: 'Мария Кузнецова',
                contactInfo: 'maria@example.com',
                preferredFirm: 'Kia',
                preferredModel: 'Rio',
                preferredYear: null,
                preferredPower: null,
                preferredTransmission: 'АКП',
                preferredCondition: 'с пробегом',
                maxPrice: 16000
            }
        ]);

        console.log("✅ Данные успешно добавлены");
        process.exit(0);
    } catch (error) {
        console.error("❌ Ошибка при наполнении БД:", error);
        process.exit(1);
    }
}

seed();
