const { getPGClient } = require("../helper");

const dotenv = require("dotenv");
dotenv.config();

const getTickerPerformanceSummary = async (interval = "1D", signer) => {
  const client = await getPGClient(signer, 2);
  let intervalQuery;
  switch (interval.toUpperCase()) {
    case "1D":
      intervalQuery = "timestamp > NOW() - INTERVAL '1 day'";
      break;
    case "1W":
      intervalQuery = "timestamp > NOW() - INTERVAL '1 week'";
      break;
    case "1M":
      intervalQuery = "timestamp > NOW() - INTERVAL '1 month'";
      break;
    case "1Y":
      intervalQuery = "timestamp > NOW() - INTERVAL '1 year'";
      break;
    default:
      return {
        statusCode: 400,
        body: "Invalid interval parameter. Use 1D, 1W, 1M or 1Y.",
      };
  }

  const queryNonKDA = `
    SELECT
      ticker,
      MIN(timestamp) as open_time,
      MAX(timestamp) as close_time,
      (array_agg(open ORDER BY timestamp ASC))[1] as open,
      (array_agg(close ORDER BY timestamp DESC))[1] as close,
      MIN(low) as low,
      MAX(high) as high,
      SUM(volume) as volume
    FROM
      hour_candles
    WHERE
      ${intervalQuery}
    GROUP BY
      ticker
  `;

  const queryKDA = `
    SELECT
      'KDA' as ticker,
      MIN(timestamp) as open_time,
      MAX(timestamp) as close_time,
      (array_agg(price ORDER BY timestamp ASC))[1] as open,
      (array_agg(price ORDER BY timestamp DESC))[1] as close,
      MIN(price) as low,
      MAX(price) as high
    FROM
      kda_price
    WHERE
      ${intervalQuery}
  `;

  try {
    const resNonKDA = await client.query(queryNonKDA);
    const resKDA = await client.query(queryKDA);
    const results = {
      tickers: [
        ...resNonKDA.rows.map((row) => ({
          ...row,
          diff: ((row.close - row.open) / row.open) * 100,
        })),
        ...resKDA.rows.map((row) => ({
          ...row,
          diff: ((row.close - row.open) / row.open) * 100,
        })),
      ],
    };

    return {
      statusCode: 200,
      body: JSON.stringify(results),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Failed to fetch data:", error);
    await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

module.exports = getTickerPerformanceSummary;
