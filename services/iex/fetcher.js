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

const iexFetch = async (url, ...args) => {
  const usingProxy = coinFlip();
  const fetchUrl = !usingProxy
    ? url
    : url.split(IEX_URL).join(pickProxies(iexProxies));
  const fetchId = `${url}:::${Math.random()}${usingProxy ? ":::PROXY" : ""}`;
  console.time(fetchId);
  return retry(
    async bail => {
      await iexRateLimit();
      return fetch(fetchUrl, ...args).then(res => {
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
