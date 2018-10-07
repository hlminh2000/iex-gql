const { ApolloServer, gql } = require("apollo-server");

const {
  createCompanyInfoLoader,
  createFinancialReportLoader,
  createPeersLoader,
  createSectorQuotesLoader
} = require("./services/iex");

const typeDefs = gql`
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

  type Stock {
    ticker: String
    companyName: String
    exchange: String
    industry: String
    website: String
    description: String
    CEO: String
    issueType: String
    sector: Sector
    tags: [String]
    financials: [FinancialReport]
    peers: [Stock]
  }

  type Sector {
    key: String
    constituents(first: Int = 10, offset: Int = 0): [Stock]
  }

  type Query {
    stock(ticker: String!): Stock
    sector(sectorName: String!): Sector
  }
`;

const resolveSector = (_, { sectorName }, context, info) => ({
  key: sectorName,
  constituents: async ({ first, offset }, context) =>
    (await context.loaders.sectorQuotesLoader.load(sectorName))
      .slice(offset, first)
      .map(({ symbol }) => resolveStock(_, { ticker: symbol }, context, info))
});

const resolveStock = async (_, { ticker }, context, info) => {
  const {
    loaders: { companyInfoLoader, financialReportLoader, peersLoader }
  } = context;
  const companyInfo = await companyInfoLoader.load(ticker);
  const resolvePeers = async () =>
    (await peersLoader.load(ticker)).map(ticker =>
      resolveStock(_, { ticker }, context, info)
    );
  return {
    ...companyInfo,
    ticker: ticker.toUpperCase(),
    financials: financialReportLoader.load(ticker),
    sector: (_, args, context, info) =>
      resolveSector(_, { sectorName: companyInfo.sector }, context, info),
    peers: resolvePeers
  };
};

const resolvers = {
  Query: {
    stock: resolveStock,
    sector: resolveSector
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    loaders: {
      companyInfoLoader: createCompanyInfoLoader(),
      financialReportLoader: createFinancialReportLoader(),
      peersLoader: createPeersLoader(),
      sectorQuotesLoader: createSectorQuotesLoader()
    }
  })
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
