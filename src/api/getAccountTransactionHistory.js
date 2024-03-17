const { DateTime } = require("luxon");
const { Client } = require("pg");
const { getChainwebPGClient } = require("../helper");

const dotenv = require("dotenv");
dotenv.config();

const getAccountTransactionHistory = async (queryParams, signer) => {
  const pgClientChainweb = await getChainwebPGClient(signer, 2);

  try {
    const { account, limit = 100, skip = 0 } = queryParams;
    if (!account) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Please define account param",
        }),
      };
    }
    const query = `
    SELECT 
      ts.requestkey, ts.amount, ts.chainid, ts.from_acct, ts.to_acct, ts.modulename, 
      t.code, t.badresult as error, t.code , t.creationtime, t.gas, t.gaslimit, t.gasprice,
      CASE 
        WHEN t.badresult IS NULL THEN 'SUCCESS'
        ELSE 'FAIL'
      END AS status,
      CASE 
        WHEN ts.to_acct = $1 THEN 'IN'
        WHEN ts.from_acct = $1 THEN 'OUT'
      END AS direction
    FROM transfers ts 
    LEFT JOIN transactions t ON t.requestkey = ts.requestkey
    WHERE ts.from_acct = $1
    OR ts.to_acct = $1 
    ORDER BY ts.height DESC
    LIMIT $2 OFFSET $3`;
    const transactions = await pgClientChainweb.query(query, [
      account,
      limit < 100 ? limit : 100,
      skip,
    ]);
    return {
      statusCode: 200,
      body: JSON.stringify(
        transactions?.rows.map((tx) => {
          let transactionType = "???";
          if (
            tx?.code?.includes("coin.transfer") ||
            tx?.code?.includes(".transfer") ||
            tx?.code?.includes("transfer-create")
          ) {
            transactionType = "TRANSFER";
          } else if (tx?.code?.includes("swap-exact-in")) {
            transactionType = "SWAP";
          }
          return {
            ...tx,
            transactionType,
            error: tx?.error?.message ?? null,
          };
        })
      ),
    };
  } catch (e) {
    console.log(e.message);
    return {
      statusCode: 500,
      body: JSON.stringify(e.message),
    };
  }
};

module.exports = getAccountTransactionHistory;
