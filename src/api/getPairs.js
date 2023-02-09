const { getAllPairs, getTickerFromID } = require("../helper");

const DEXES = ["kaddex", "kdswap"];

const getSortKey = (sort) => {
  switch (sort) {
    case "hour":
      return "pricePercChange1h";
    case "day":
      return "pricePercChange24h";
    case "week":
      return "pricePercChange7d";
    case "price":
      return "price";
    case "marketcap":
      return "marketCap";
    default:
      return "volume24h";
  }
};

const getPairs = async (queryParams = {}) => {
  const id = queryParams.id;
  const exchange = queryParams.exchange;
  const sort = queryParams.sort;
  const allPairs = await getAllPairs();
  const result = {
    statusCode: 400,
    body: JSON.stringify({ error: "Please define both id & exchange or none" }),
  };

  if (!id && !exchange) {
    const dexPairs = [allPairs.kaddex, allPairs.kdswap]
      .flat()
      .map((obj) => Object.values(obj));

    result.statusCode = 200;
    result.body = JSON.stringify(
      dexPairs
        .flat()
        .sort(
          (tokenA, tokenB) =>
            tokenB[getSortKey(sort)] - tokenA[getSortKey(sort)]
        )
    );
    return result;
  }

  if (id && exchange) {
    const dex = exchange.toLowerCase();
    if (DEXES.indexOf(dex) === -1) {
      result.body = JSON.stringify({
        error: `exchange: ${dex} not known (kaddex, kdswap only)`,
      });
      result.statusCode = 400;
      return result;
    }
    const ticker = getTickerFromID(id);
    const pair =
      allPairs[dex] && allPairs[dex][ticker] ? allPairs[dex][ticker] : null;

    result.body = JSON.stringify(
      pair ? pair : { error: `dex: ${dex} ticker: ${ticker} does not exist` }
    );
    result.statusCode = pair ? 200 : 400;
    return result;
  }
  return result;
};

module.exports = getPairs;
