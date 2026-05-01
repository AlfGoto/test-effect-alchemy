import * as Alchemy from "alchemy";
import * as AWS from "alchemy/AWS";
import * as DynamoDB from "alchemy/AWS/DynamoDB";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "TestAlchemy",
  {
    providers: AWS.providers(),
    state: Alchemy.localState(),
  },
  Effect.gen(function* () {
    const table = yield* DynamoDB.Table("Counter", {
      partitionKey: "pk",
      attributes: { pk: "S" },
    });

    const api = yield* AWS.Lambda.Function(
      "CounterApi",
      {
        main: "./src/handler.ts",
        url: true,
        env: { COUNTER_TABLE_NAME: table.tableName },
        isExternal: true,
      },
      Effect.gen(function* () {
        yield* DynamoDB.UpdateItemPolicy.bind(table);
      })
    );

    return { url: api.functionUrl, tableName: table.tableName };
  })
);
