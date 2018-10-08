const RateLimit = require("async-sema/rate-limit");
const fetch = require("isomorphic-fetch");
const retry = require("async-retry");

const IEX_URL = `https://api.iextrading.com/1.0`;
const IEX_PROXIES = process.env.IEX_PROXIES || `http://localhost:5000`;

const iexProxies = IEX_PROXIES.split(" ")
  .join("")
  .split(",");
const pickProxies = proxies =>
  proxies[Math.floor(Math.random() * proxies.length)];

const iexRateLimit = RateLimit(50);

const coinFlip = () => Math.random() > 1 / (iexProxies.length + 1);

const iexFetch = async (path, ...args) => {
  const usingProxy = coinFlip();
  const pickedProxy = pickProxies(iexProxies);
  const url = `${usingProxy ? pickedProxy : IEX_URL}${path}`;
  const fetchId = `${path}___${Math.random()}${
    usingProxy ? `___PROXY_${iexProxies.indexOf(pickedProxy)}` : ""
  }`;
  console.time(fetchId);
  return retry(
    async bail => {
      await iexRateLimit();
      return fetch(url, ...args).then(res => {
        console.timeEnd(fetchId);
        return res;
      });
    },
    { retries: 5 }
  );
};

module.exports = {
  iexFetch,
  IEX_URL
};
