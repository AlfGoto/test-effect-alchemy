import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table, Entity, item, string, number } from "dynamodb-toolbox";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const CounterTable = new Table({
  documentClient: docClient,
  name: process.env.COUNTER_TABLE_NAME!,
  partitionKey: { name: "pk", type: "string" },
});

export const CounterEntity = new Entity({
  table: CounterTable,
  name: "Counter",
  schema: item({
    pk: string().key(),
    count: number().default(0),
  }),
});
