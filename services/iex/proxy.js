const RateLimit = require("async-sema/rate-limit");
const express = require("express");
const fetch = require("isomorphic-fetch");
const PORT = process.env.PORT || 5000;

const IEX_URL = `https://api.iextrading.com/1.0`;

const app = express();

const iexRateLimit = RateLimit(100);

app.get("*", (req, res) => {
  iexRateLimit().then(() =>
    fetch(`${IEX_URL}${req.originalUrl}`)
      .then(res => res.json())
      .catch(err => {})
      .then(stuff => {
        res.send(stuff);
      })
  );
});

app.listen(PORT, () => {
  console.log(`⚡️  Proxy ready at http://localhost:${PORT}`);
});
