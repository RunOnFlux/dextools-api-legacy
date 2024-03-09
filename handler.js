"use strict";

const { Signer } = require("@aws-sdk/rds-signer");

const signer = new Signer({
  hostname: process.env.PGHOST,
  username: process.env.PGUSER,
  port: 5432,
});

const pairsUpdater = require("./src/updater/pairsUpdater");
const pairsUpdaterHandler = async (event) => {
  await pairsUpdater(signer);
};

const getAccountBalanceChart = require("./src/api/getAccountBalaceChart");
const getAccountBalanceChartHandler = async (event) => {
  const { queryStringParameters } = event;
  const queryParams = queryStringParameters ? queryStringParameters : {};
  const result = await getAccountBalanceChart(queryParams);
  return addHeader(result);
};

const getPairs = require("./src/api/getPairs");
const getPairsHandler = async (event) => {
  const { queryStringParameters } = event;
  const queryParams = queryStringParameters ? queryStringParameters : {};
  const result = await getPairs(queryParams);
  return addHeader(result);
};

const getTransactions = require("./src/api/getTransactions");
const getTransactionsHandler = async (event) => {
  const { queryStringParameters } = event;
  const queryParams = queryStringParameters ? queryStringParameters : {};
  const result = await getTransactions(queryParams, signer);
  return addHeader(result);
};

const getConfig = require("./src/udf/getConfig");
const getConfigHandler = async (event) => {
  const result = getConfig();
  return buildResponse(200, result);
};

const getSymbols = require("./src/udf/getSymbols");
const getSymbolsHandler = async (event) => {
  const { queryStringParameters } = event;
  const queryParams = queryStringParameters ? queryStringParameters : {};
  const result = await getSymbols(queryParams, signer);
  return addHeader(result);
};

const searchHandler = async (event) => {
  return buildResponse(200, {});
};

const getHistory = require("./src/udf/getHistory");
const { addHeader, buildResponse } = require("./src/helper");
const getHistoryHandler = async (event) => {
  const { queryStringParameters } = event;
  const queryParams = queryStringParameters ? queryStringParameters : {};
  const result = await getHistory(queryParams, signer);
  return addHeader(result);
};

module.exports = {
  pairsUpdaterHandler,
  getAccountBalanceChartHandler,
  getPairsHandler,
  getTransactionsHandler,
  getConfigHandler,
  getSymbolsHandler,
  searchHandler,
  getHistoryHandler,
};

// module.exports.hello = async (event) => {
//   return {
//     statusCode: 200,
//     body: JSON.stringify(
//       {
//         message: 'Go Serverless v1.0! Your function executed successfully!',
//         input: event,
//       },
//       null,
//       2
//     ),
//   };

//   // Use this code if you don't use the http event with the LAMBDA-PROXY integration
//   // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
// };
