//@ts-check
const RateLimit = require("async-sema/rate-limit");
const fetch = require("isomorphic-fetch");
const retry = require("async-retry");
const { IEX_PROXIES } = require("../config");
const { createIexCacheManager } = require("../mongo");

const IEX_URL = `https://api.iextrading.com/1.0`;
const cacheManager = createIexCacheManager();

const pickProxies = proxies =>
  proxies[Math.floor(Math.random() * proxies.length)];

const iexRateLimit = RateLimit(200);

const coinFlip = ({ trueProb = 0.5 } = {}) => Math.random() > 1 - trueProb;

const pickProxy = () => Math.random() > 1 / (IEX_PROXIES.length + 1);

const iexFetch = async (path, ...args) => {
  const cached = await cacheManager.getCache({ path });
  const useCache = coinFlip({ trueProb: 0.5 });
  if (cached && useCache) {
    console.log(`[cached]: ${path}`);
    return cached;
  }
  const usingProxy = coinFlip({ trueProb: 1 - 1 / (IEX_PROXIES.length + 1) });
  const pickedProxy = pickProxies(IEX_PROXIES);
  const url = `${usingProxy ? pickedProxy : IEX_URL}${path}`;
  const fetchId = `${path}___${Math.random()}${
    usingProxy ? `___PROXY_${IEX_PROXIES.indexOf(pickedProxy)}` : ""
  }`;
  console.time(fetchId);
  return retry(
    async bail => {
      await iexRateLimit();
      return fetch(url, ...args)
        .then(res => {
          return res;
        })
        .then(res => res.json())
        .then(content => {
          console.timeEnd(fetchId);
          return cacheManager.saveCache({ path, content });
        });
    },
    { retries: 5 }
  );
};

module.exports = {
  iexFetch,
  IEX_URL
};
