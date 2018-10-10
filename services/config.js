module.exports = {
  PORT: process.env.PORT || 4000,
  IEX_PROXIES: (process.env.IEX_PROXIES || `http://localhost:5000`)
    .split(" ")
    .join("")
    .split(","),
  MONGO_USERNAME: process.env.MONGO_USERNAME,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
  MONGO_URL: process.env.MONGO_URL,
  MONGO_DATABASE: process.env.MONGO_DATABASE
};
