const mongoose = require("mongoose");
const addDays = require("date-fns/add_days");
const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_URL,
  MONGO_DATABASE
} = require("../config");

const mongoString = `mongodb://${MONGO_URL}/${MONGO_DATABASE}`;
console.log(mongoString);

mongoose.connect(
  mongoString,
  { useNewUrlParser: true },
  err => {
    if (err) {
      console.error(err);
      process.exit(1);
    } else {
      console.log(`connected to mongodb at: ${MONGO_URL}/${MONGO_DATABASE}`);
    }
  }
);

const createIexCacheManager = ({ cacheDays = 10 } = {}) => {
  let IexCache;
  try {
    IexCache = mongoose.model(
      "iex_cache",
      new mongoose.Schema(
        {
          _id: String,
          path: { type: String, required: true },
          expiry: { type: Date, default: () => addDays(Date.now(), cacheDays) },
          content: {}
        },
        { _id: false }
      )
    );
  } catch (err) {
    console.log("iex_cache model already exists");
    IexCache = mongoose.model("iex_cache");
  }

  const saveCache = (
    /** @type {{path: string, content: any}}*/
    { path, content }
  ) => {
    return new Promise((resolve, reject) =>
      new IexCache({
        _id: path,
        path,
        content
      }).save((err, doc) => {
        if (err) {
          IexCache.findOneAndUpdate(
            { _id: path },
            { path, content },
            (err, doc) => {
              if (err) {
                console.log("err: ", err);
                reject(err);
              } else {
                // console.log("doc: ", doc);
                resolve(content);
              }
            }
          );
        } else {
          // console.log("doc: ", doc);
          resolve(content);
        }
      })
    );
  };
  const getCache = (
    /** @type {{path: string}}*/
    { path }
  ) =>
    new Promise((resolve, reject) =>
      IexCache.findById(path)
        .where("expiry")
        .gte(Date.now())
        .exec((err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(doc ? doc.content : null);
          }
        })
    );
  return { saveCache, getCache };
};

module.exports = {
  createIexCacheManager
};
