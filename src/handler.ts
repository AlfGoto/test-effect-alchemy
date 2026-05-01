import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table, Entity, item, string, number } from "dynamodb-toolbox";
import { UpdateItemCommand, $add } from "dynamodb-toolbox";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CounterTable = new Table({
  documentClient: docClient,
  name: process.env.COUNTER_TABLE_NAME!,
  partitionKey: { name: "pk", type: "string" },
});

const CounterEntity = new Entity({
  table: CounterTable,
  name: "Counter",
  schema: item({
    pk: string().key(),
    count: number().default(0),
  }),
});

export default async (event: any) => {
  // Ignore favicon requests
  if (event.rawPath === "/favicon.ico") {
    return { statusCode: 404, body: "" };
  }
  const result = await CounterEntity.build(UpdateItemCommand)
    .item({ pk: "counter", count: $add(1) })
    .options({ returnValues: "ALL_NEW" })
    .send();

  return {
    statusCode: 200,
    body: `Count: ${result.Attributes?.count ?? 0}`,
  };
};
