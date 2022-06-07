const createRequest = require('./index').createRequest;

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || '8080';

app.use(bodyParser.json());

app.get('/', (req, res) => {
    createRequest(req.body, (status, result) => {
        res.status(status).json(result);
    });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
