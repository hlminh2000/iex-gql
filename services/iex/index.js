const DataLoader = require("dataloader");
const { iexFetch, IEX_URL } = require("./fetcher");

const toUrl = ticker => encodeURI(ticker.toLowerCase());

const createCompanyInfoLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker =>
        iexFetch(`${IEX_URL}/stock/${toUrl(ticker)}/company`).then(res =>
          res.json()
        )
      )
    )
  );

const createFinancialReportLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker =>
        iexFetch(`${IEX_URL}/stock/${toUrl(ticker)}/financials`)
          .then(res => res.json())
          .then(({ financials }) => financials)
      )
    )
  );

const createPeersLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker =>
        iexFetch(`${IEX_URL}/stock/${toUrl(ticker)}/peers`).then(res =>
          res.json()
        )
      )
    )
  );

const createSectorQuotesLoader = () =>
  new DataLoader(sectors =>
    Promise.all(
      sectors.map(sector =>
        iexFetch(
          `${IEX_URL}/stock/market/collection/sector?collectionName=${encodeURI(
            sector
          )}`
        ).then(res => res.json())
      )
    )
  );

const createEarningsLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker =>
        iexFetch(`${IEX_URL}/stock/${ticker}/earnings`)
          .then(res => res.json())
          .then(({ earnings }) => earnings)
      )
    )
  );

const createStockStatsLoader = () =>
  new DataLoader(tickers =>
    Promise.all(
      tickers.map(ticker =>
        iexFetch(`${IEX_URL}/stock/${ticker}/stats`).then(res => res.json())
      )
    )
  );

module.exports = {
  createCompanyInfoLoader,
  createFinancialReportLoader,
  createPeersLoader,
  createSectorQuotesLoader,
  createEarningsLoader,
  createStockStatsLoader
};