import { Effect, pipe } from "effect";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import { UpdateItemCommand, $add } from "dynamodb-toolbox";
import { CounterEntity } from "./db";

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

export const fetch = pipe(
  handler,
  Effect.catchTag("CounterError", (error) =>
    Effect.succeed(
      HttpServerResponse.text(`Error: ${error.message}`, { status: 500 })
    )
  )
);

export default {};
