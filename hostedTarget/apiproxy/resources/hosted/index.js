const express = require('express'),
      fetch   = require('node-fetch'),
      winston = require('winston');

const app     = express();
const port    = process.env.PORT || 3000;
const DEBUG   = process.env.DEBUG || 'info';

let apikey = "";
const backends = {
  "get": "https://httpbin.org/get",
  "headers": "https://httpbin.org/headers"
};

const logger = winston.createLogger({
  level: DEBUG,
  defaultMeta: { service: 'catalog' },
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Error handler
app.use((err, req, res, next) => {
  logger.error( "We failed with error: %s", err );
  res.status(500).json({ "error": err, "code": 500 })
  next();
});

app.get('/', async (req, res) => {
  logger.info('Entering / request');

  let backendPromises = Object.keys(backends).map( async (key) => {
    let request = {
      method: "GET",
      headers: {
        "x-api-key": apikey,
        "accept": "application/json"
      }
    }
    let result = await fetch(backends[key], request)
      .then( x => x.json() )
      .then( x => {
        logger.debug('Our response for url: %s', backends[key],x);
        let y = {};
        y[key] = x;
        return y;
      })
    return result;
  })

  let pResults = await Promise.all(backendPromises);

  logger.debug('Unparsed results: ', pResults);
  res.json(pResults);

});

app.listen(port, () => {
  console.log("And we're starting up");
  console.log(`Example app listening at http://localhost:${port}`);
});
