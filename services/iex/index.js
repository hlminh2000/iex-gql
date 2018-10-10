const DataLoader = require("dataloader");
const { iexFetch } = require("./fetcher");
const { createIexCacheManager } = require("../mongo");

const toUrl = ticker => encodeURI(ticker.toLowerCase());
const cacheManager = createIexCacheManager();

const createCompanyInfoLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker => iexFetch(`/stock/${toUrl(ticker)}/company`))
    )
  );

const createFinancialReportLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker =>
        iexFetch(`/stock/${toUrl(ticker)}/financials`).then(
          ({ financials }) => financials
        )
      )
    )
  );

const createPeersLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker => iexFetch(`/stock/${toUrl(ticker)}/peers`))
    )
  );

const createSectorQuotesLoader = () =>
  new DataLoader(sectors =>
    Promise.all(
      sectors.map(sector =>
        iexFetch(
          `/stock/market/collection/sector?collectionName=${encodeURI(sector)}`
        )
      )
    )
  );

const createEarningsLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker =>
        iexFetch(`/stock/${ticker}/earnings`).then(({ earnings }) => earnings)
      )
    )
  );

const createStockStatsLoader = () =>
  new DataLoader(tickers =>
    Promise.all(tickers.map(ticker => iexFetch(`/stock/${ticker}/stats`)))
  );

module.exports = {
  createCompanyInfoLoader,
  createFinancialReportLoader,
  createPeersLoader,
  createSectorQuotesLoader,
  createEarningsLoader,
  createStockStatsLoader
};
