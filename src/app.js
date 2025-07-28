const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../docs')));
app.use(express.json());

app.use('/api', apiRoutes);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
