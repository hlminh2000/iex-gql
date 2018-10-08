const {
  ApolloServer,
  gql,
  makeExecutableSchema
} = require("apollo-server-express");
const { extendSchema } = require("graphql");
const { graphqlLodash, lodashDirectiveAST } = require("graphql-lodash");

const {
  createCompanyInfoLoader,
  createFinancialReportLoader,
  createPeersLoader,
  createSectorQuotesLoader,
  createEarningsLoader,
  createStockStatsLoader
} = require("../services/iex");

const typeDefs = gql`
  enum SectorName {
    UTILITIES
    REAL_ESTATE
    ENERGY
    HEALTHCARE
    FINANCIAL_SERVICES
    INDUSTRIALS
    CONSUMER_CYCLICAL
    COMMUNICATION_SERVICES
    CONSUMER_DEFENSIVE
    TECHNOLOGY
    BASIC_MATERIALS
  }

  type FinancialReport {
    reportDate: String
    grossProfit: Float
    costOfRevenue: Float
    operatingRevenue: Float
    totalRevenue: Float
    operatingIncome: Float
    netIncome: Float
    researchAndDevelopment: Float
    operatingExpense: Float
    currentAssets: Float
    totalAssets: Float
    totalLiabilities: Float
    currentCash: Float
    currentDebt: Float
    totalCash: Float
    totalDebt: Float
    shareholderEquity: Float
    cashChange: Float
    cashFlow: Float
    operatingGainsLosses: Float
  }

  type Earning {
    actualEPS: Float
    consensusEPS: Float
    estimatedEPS: Float
    announceTime: String
    numberOfEstimates: Int
    EPSSurpriseDollar: Float
    EPSReportDate: String
    fiscalPeriod: String
    fiscalEndDate: String
    yearAgo: Float
    yearAgoChangePercent: Float
    estimatedChangePercent: Float
    symbolId: ID
  }

  type CompanyInfo {
    companyName: String
    exchange: String
    industry: String
    website: String
    description: String
    CEO: String
    issueType: String
    sector: String
    tags: [String]
  }

  type StockKeyStats {
    companyName: String
    marketcap: Float
    beta: Float
    week52high: Float
    week52low: Float
    week52change: Float
    shortInterest: Float
    shortDate: String
    dividendRate: Float
    dividendYield: Float
    exDividendDate: String
    latestEPS: Float
    latestEPSDate: String
    sharesOutstanding: Float
    float: Float
    returnOnEquity: Float
    consensusEPS: Float
    numberOfEstimates: Int
    symbol: String
    EBITDA: Float
    revenue: Float
    grossProfit: Float
    cash: Float
    debt: Float
    ttmEPS: Float
    revenuePerShare: Float
    revenuePerEmployee: Float
    peRatioHigh: Float
    peRatioLow: Float
    EPSSurpriseDollar: Float
    EPSSurprisePercent: Float
    returnOnAssets: Float
    returnOnCapital: Float
    profitMargin: Float
    priceToSales: Float
    priceToBook: Float
    day200MovingAvg: Float
    day50MovingAvg: Float
    institutionPercent: Float
    insiderPercent: Float
    shortRatio: Float
    year5ChangePercent: Float
    year2ChangePercent: Float
    year1ChangePercent: Float
    ytdChangePercent: Float
    month6ChangePercent: Float
    month3ChangePercent: Float
    month1ChangePercent: Float
    day5ChangePercent: Float
  }

  type Stock {
    ticker: String
    companyInfo: CompanyInfo
    keyStats: StockKeyStats
    peers: [Stock]
    financials: [FinancialReport]
    earnings: [Earning]
    sector: Sector
  }

  type Sector {
    key: String
    constituentCount(first: Int = 10, offset: Int = 0): Int
    constituents(first: Int = 10, offset: Int = 0): [Stock]
  }

  type Query {
    stock(ticker: String!): Stock
    sector(sectorName: SectorName!): Sector
  }
`;

const toGqlSectorName = sectorName =>
  sectorName
    .split(" ")
    .join("_")
    .toUpperCase();

const resolveEarnings = (_, { ticker }, context, info) => {
  return context.loaders.earningsLoader.load(ticker);
};

const resolveSector = (_, { sectorName }, context, info) => ({
  key: toGqlSectorName(sectorName),
  constituentCount: async ({ offset, first }, context) => {
    return (await context.loaders.sectorQuotesLoader.load(sectorName)).slice(
      offset,
      offset + first
    ).length;
  },
  constituents: async ({ offset, first }, context, info) => {
    return (await context.loaders.sectorQuotesLoader.load(sectorName))
      .slice(offset, offset + first)
      .map(({ symbol }) => resolveStock(_, { ticker: symbol }, context, info));
  }
});

const resolveStock = async (_, { ticker }, context, info) => {
  const {
    loaders: {
      companyInfoLoader,
      financialReportLoader,
      peersLoader,
      keyStatsLoader
    }
  } = context;
  const resolvePeers = async () =>
    (await peersLoader.load(ticker)).map(ticker =>
      resolveStock(_, { ticker }, context, info)
    );
  return {
    ticker: () => ticker.toUpperCase(),
    companyInfo: () => companyInfoLoader.load(ticker),
    financials: () => financialReportLoader.load(ticker),
    sector: async (args, context, info) =>
      resolveSector(
        _,
        { sectorName: (await companyInfoLoader.load(ticker)).sector },
        context,
        info
      ),
    peers: resolvePeers,
    earnings: (args, context, info) =>
      resolveEarnings(_, { ticker }, context, info),
    keyStats: () => keyStatsLoader.load(ticker)
  };
};

const resolvers = {
  SectorName: {
    UTILITIES: "Utilities",
    REAL_ESTATE: "Real Estate",
    ENERGY: "Energy",
    HEALTHCARE: "Healthcare",
    FINANCIAL_SERVICES: "Financial Services",
    INDUSTRIALS: "Industrials",
    CONSUMER_CYCLICAL: "Consumer Cyclical",
    COMMUNICATION_SERVICES: "Communication Services",
    CONSUMER_DEFENSIVE: "Consumer Defensive",
    TECHNOLOGY: "Technology",
    BASIC_MATERIALS: "Basic Materials"
  },
  Query: {
    stock: resolveStock,
    sector: resolveSector
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers: { ...resolvers } });
const createServer = ({ gqlPath, formatResponse = res => res }) =>
  new ApolloServer({
    schema: extendSchema(schema, lodashDirectiveAST),
    context: () => ({
      loaders: {
        companyInfoLoader: createCompanyInfoLoader(),
        financialReportLoader: createFinancialReportLoader(),
        peersLoader: createPeersLoader(),
        sectorQuotesLoader: createSectorQuotesLoader(),
        earningsLoader: createEarningsLoader(),
        keyStatsLoader: createStockStatsLoader()
      }
    }),
    graphqlPath: gqlPath,
    formatResponse: (res, { queryString, operationName }) => {
      const { transform } = graphqlLodash(queryString, operationName);
      console.time("transform");
      res.data = transform(res.data);
      console.timeEnd("transform");
      return formatResponse(res);
    }
  });

module.exports = createServer;
