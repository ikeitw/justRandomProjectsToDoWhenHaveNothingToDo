const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ensembles', require('./routes/ensembles'));
app.use('/api/records', require('./routes/records'));
app.use('/api/functions', require('./routes/functions'));
app.use('/api/musicians', require('./routes/musicians'));
app.use('/api/compositions', require('./routes/compositions'));

const PORT = 3000;
app.listen(PORT, () => console.log(`🎵 API running on port ${PORT}`));
