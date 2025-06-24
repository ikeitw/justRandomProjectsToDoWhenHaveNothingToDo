const { sequelize, Ensemble, Musician, Composition, Record, Company, Performance, SaleStats } = require('./models');

async function seed() {
    await sequelize.sync({ force: true });

    const company = await Company.create({
        name: 'EMI',
        address: 'Лондон, Великобритания'
    });

    const ensemble = await Ensemble.create({ name: 'Джаз Бэнд', type: 'Джаз' });

    const musicians = await Musician.bulkCreate([
        { name: 'Иванов И.И.', role: 'Саксофонист', EnsembleId: ensemble.id },
        { name: 'Петров П.П.', role: 'Дирижер', EnsembleId: ensemble.id }
    ]);

    const compositions = await Composition.bulkCreate([
        { title: 'Autumn Jazz', genre: 'Jazz', EnsembleId: ensemble.id },
        { title: 'Summer Blues', genre: 'Blues', EnsembleId: ensemble.id }
    ]);

    const record = await Record.create({
        title: 'Golden Jazz Collection',
        releaseDate: new Date(),
        wholesalePrice: 15,
        retailPrice: 20,
        stock: 100,
        CompanyId: company.id
    });

    const performances = await Performance.bulkCreate([
        { notes: 'Живое исполнение', CompositionId: compositions[0].id, RecordId: record.id },
        { notes: 'Студийная версия', CompositionId: compositions[1].id, RecordId: record.id }
    ]);

    await SaleStats.create({
        RecordId: record.id,
        soldLastYear: 150,
        soldThisYear: 200
    });

    console.log('✅ База успешно заполнена тестовыми данными.');
    await sequelize.close();
}

seed();
