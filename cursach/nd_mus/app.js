const express = require('express');
const path = require('path');
const { sequelize } = require('./models');
const controller = require('./controllers/musicStoreController');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function init() {
    await sequelize.authenticate();
    console.log('✅ База подключена');
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/ensemble/compositions', async (req, res) => {
    const id = req.body.ensembleId;
    const count = await controller.getCompositionCountByEnsemble(id);
    res.render('result', { title: 'Произведения ансамбля', result: count });
});

app.post('/ensemble/records', async (req, res) => {
    const id = req.body.ensembleId;
    const result = await controller.getRecordsByEnsemble(id);
    res.render('result', { title: 'Пластинки ансамбля', result: result.join('<br>') });
});

app.get('/bestsellers', async (req, res) => {
    const result = await controller.getBestSellers();
    res.render('result', { title: 'Лидеры продаж', result: result.join('<br>') });
});

app.post('/record/add', async (req, res) => {
    const message = await controller.addOrUpdateRecord({
        title: req.body.title,
        releaseDate: new Date(),
        wholesalePrice: req.body.price * 0.8,
        retailPrice: req.body.price,
        stock: req.body.stock
    });
    res.render('result', { title: 'Добавление пластинки', result: message });
});

app.post('/ensemble/add', async (req, res) => {
    const message = await controller.addEnsemble(req.body.name, req.body.type);
    res.render('result', { title: 'Добавление ансамбля', result: message });
});

const PORT = 3000;
app.listen(PORT, async () => {
    await init();
    console.log(`🚀 GUI сервер запущен: http://localhost:${PORT}`);
});
