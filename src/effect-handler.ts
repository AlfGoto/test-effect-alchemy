import { Effect, Layer, Context } from "effect";
import * as HttpServer from "effect/unstable/http/HttpServer";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
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

class CounterError extends Error {
  readonly _tag = "CounterError";
}

const incrementCounter = Effect.tryPromise({
  try: () =>
    CounterEntity.build(UpdateItemCommand)
      .item({ pk: "counter", count: $add(1) })
      .options({ returnValues: "ALL_NEW" })
      .send(),
  catch: (e) => new CounterError(String(e)),
});

const handler = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === "/favicon.ico") {
    return HttpServerResponse.empty({ status: 404 });
  }

  const result = yield* incrementCounter;
  const count = result.Attributes?.count ?? 0;

  return HttpServerResponse.text(`Count: ${count}`);
});

export const fetch = handler.pipe(
  Effect.catchAll((error) =>
    Effect.succeed(
      HttpServerResponse.text(`Error: ${error.message}`, { status: 500 })
    )
  )
);

export default {};
