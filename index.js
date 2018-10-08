const express = require("express");
const createGqlServer = require("./graphql");

const PORT = process.env.PORT || 4000;

const GRAPHQL_PATH = "/graphql";

const app = express();
app.use(GRAPHQL_PATH, (req, res, next) => {
  req.setTimeout(0);
  console.time(GRAPHQL_PATH);
  next();
});
const server = createGqlServer({
  gqlPath: GRAPHQL_PATH,
  formatResponse: res => {
    console.timeEnd(GRAPHQL_PATH);
    return res;
  }
});
server.applyMiddleware({ app });

app.listen(PORT, () => {
  console.log(`🚀  Server ready at http://localhost:${PORT}`);
});
