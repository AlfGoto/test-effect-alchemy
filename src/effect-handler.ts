import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

export default {};

export const fetch = HttpServerResponse.text("Hello from Effect!");
