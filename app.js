const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const redis = require('redis');
const request = require('request-promise')

const redis_port = process.env.REDIS_PORT || 6379;
const app_port = process.env.APP_PORT || 8000;
const beer_host = process.env.BEER_API_HOST || 'http://api.punkapi.com/v2/beers';

const redis_options = {
    host: '127.0.0.1',
    port: redis_port,
    logErrors: true
};

const client = redis.createClient(redis_options);

const request_options = {
    method: 'GET',
    uri: beer_host,
    json: true,
    resolveWithFullResponse: true
}


client.on('connect', () => {
    console.log('Connected to redis...')
})

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(methodOverride('_method'));

app.get('/v2/beers', (req, res) => {
    const timeOut = req.query.cacheTime
    const ids = req.query.ids;

    client.get(ids, (err, data) => {
        if (err) throw err;
        if (data !== null) {
            res.send(JSON.parse(data));
        } else {
            request_options.qs = {
                ids: ids
            }
            request(request_options)
                .then(function (response) {
                    client.setex(ids, timeOut, JSON.stringify(response.body));
                    res.send(response.body);
                })
                .catch(function (err) {
                    throw {
                        error: 'Internal Server Error'
                    }
                })
        }
    })


});


app.listen(app_port, () => {
    console.log(`Server started at port ${app_port}`);
})