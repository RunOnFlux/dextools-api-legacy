const dotenv = require("dotenv");
const { getSymbol, getPGClient } = require("../helper");
const { supported_resolutions } = require("../helper");
dotenv.config();;

const getSymbols = async (queryParams, signer) => {
  const client = await getPGClient(signer, 2)
  const { symbol } = queryParams;
  if (!symbol) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "please specify the required fields" }),
    };
  }
  const symbolInfo = getSymbol(symbol);
  const { ticker, base, group } = symbolInfo;
  const closeQuery =
    base === "USD"
      ? `SELECT close FROM ${group.toLowerCase()}_price WHERE ticker=$1 ORDER BY timestamp DESC LIMIT 1`
      : `SELECT close * price AS close FROM ${group.toLowerCase()}_price k INNER JOIN kda_price p ON k.timestamp=p.timestamp WHERE ticker=$1 ORDER BY timestamp DESC LIMIT 1`;
  const [tokensResp, currentPrice] = await Promise.all([
    client.query(
      "SELECT name, ticker, address FROM token_info t INNER JOIN dex_info d ON t.address = d.token_address WHERE dex = $1 AND t.ticker = $2",
      [group.toLowerCase(), ticker]
    ),
    client.query(closeQuery, [ticker]),
  ]);

  if (tokensResp.rowCount === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({}),
    };
  }
  const token = tokensResp.rows[0];
  const { close } = currentPrice.rows[0];
  const numZeros = -Math.floor(Math.log10(parseFloat(close)) + 1) + 4;
  const pricescale = 10 ** numZeros > 1000 ? 10 ** numZeros : 1000;
  return {
    statusCode: 200,
    body: JSON.stringify({
      symbol,
      description: token.name,
      ticker: symbol,
      pricescale,
      type: "crypto",
      "has-no-volume": false,
      "exchange-listed": group,
      "exchange-traded": group,
      minmovement: 1,
      "has-dwm": true,
      "has-intraday": true,
      timezone: "Etc/UTC",
      supported_resolutions,
      has_intraday: true,
      intraday_multipliers: ["1", "15", "30", "60"],
      "session-regular": "24x7",
    }),
  };
};

module.exports = getSymbols;
