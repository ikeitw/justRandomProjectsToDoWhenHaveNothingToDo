const { Ensemble, Composition, Record, SaleStats } = require('../models');

// 1) Количество музыкальных произведений ансамбля
async function getCompositionCountByEnsemble(ensembleId) {
    const count = await Composition.count({ where: { EnsembleId: ensembleId } });
    return `Количество произведений ансамбля: ${count}`;
}

// 2) Названия всех пластинок ансамбля
async function getRecordsByEnsemble(ensembleId) {
    const compositions = await Composition.findAll({
        where: { EnsembleId: ensembleId },
        include: { model: require('../models').Performance, include: require('../models').Record }
    });

    const recordTitles = new Set();
    compositions.forEach(comp => {
        comp.Performances.forEach(perf => {
            if (perf.Record) {
                recordTitles.add(perf.Record.title);
            }
        });
    });

    return [...recordTitles];
}

// 3) Лидеры продаж текущего года
async function getBestSellers() {
    const stats = await SaleStats.findAll({
        order: [['soldThisYear', 'DESC']],
        limit: 5,
        include: require('../models').Record
    });

    return stats.map(s => `${s.Record.title} — Продано: ${s.soldThisYear}`);
}

// 4) Добавить или изменить данные о пластинке
async function addOrUpdateRecord(data) {
    let record = await Record.findOne({ where: { title: data.title } });
    if (record) {
        await record.update(data);
        return "Данные о пластинке обновлены.";
    } else {
        await Record.create(data);
        return "Новая пластинка добавлена.";
    }
}

// 5) Добавить новый ансамбль
async function addEnsemble(name, type) {
    const ensemble = await Ensemble.create({ name, type });
    return `Добавлен ансамбль: ${ensemble.name}`;
}

module.exports = {
    getCompositionCountByEnsemble,
    getRecordsByEnsemble,
    getBestSellers,
    addOrUpdateRecord,
    addEnsemble
};
