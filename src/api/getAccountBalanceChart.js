const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { parse } = require("zipson/lib");

const ddbClient = new DynamoDBClient({
  region: "us-east-1",
  endpoint: process.env.AWS_ENDPOINT || undefined,
});
const KADENA_ACCOUNTS_TABLE =
  process.env.KADENA_ACCOUNTS_TABLE || "kadena-accounts";
const KADENA_ACCOUNTS_BALANCE_TABLE = "kadena-accounts-balance";

const verifyAndAddAccount = async (account) => {
  try {
    const getResponse = await ddbClient.send(
      new GetCommand({
        TableName: KADENA_ACCOUNTS_TABLE,
        Key: { account },
      })
    );

    if (!getResponse.Item) {
      const item = {
        TableName: KADENA_ACCOUNTS_TABLE,
        Item: {
          account,
        },
      };
      await ddbClient.send(new PutCommand(item));
      // Account added successfully
    }
    return true;
  } catch (error) {
    console.error("Error verifying and adding account:", error);
    throw error;
  }
};

const getAccountBalanceChart = async (queryParams = {}) => {
  const { account, from, to } = queryParams;

  if (!account || !from || !to) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Please define params: account, from, to",
      }),
    };
  }

  await verifyAndAddAccount(account);

  try {
    const queryCommandInput = {
      TableName: KADENA_ACCOUNTS_BALANCE_TABLE,
      KeyConditionExpression:
        "#account = :account AND #date BETWEEN :from AND :to",
      ExpressionAttributeValues: {
        ":account": { S: account },
        ":from": { S: from },
        ":to": { S: to },
      },
      ExpressionAttributeNames: {
        "#account": "account",
        "#date": "date",
      },
    };

    const data = await ddbClient.send(new QueryCommand(queryCommandInput));
    const items = data.Items.map((item) => unmarshall(item)).map((item) => ({
      date: item.date,
      totalUsdValue: item.totalUsdValue,
      data: parse(item.balances),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error("Error fetching account balance chart data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "An error occurred while fetching account balance chart data",
      }),
    };
  }
};

module.exports = getAccountBalanceChart;
