import type { buildPMFScorecard } from "./pmf-scorecard.js";

type Result = ReturnType<typeof buildPMFScorecard>["result"];
const INPUT_KEYS = ["product", "target_market", "current_metrics", "time_in_market", "customer_feedback", "business_model", "your_sector"] as const;

/** Literal form inputs are component-only; model-visible data retains server escaping. */
export function pmfWidgetResult(result: Result, safeInputs: unknown, literalInputs: unknown, textFallback: string) {
  const select = (input: unknown) => Object.fromEntries(
    INPUT_KEYS.filter(key => typeof (input as Record<string, unknown> | null)?.[key] === "string")
      .map(key => [key, (input as Record<string, string>)[key]])
  );
  return {
    structuredContent: {
      schemaVersion: 1, tool: "pmf_scorecard",
      input: select(safeInputs), result,
      warnings: result.limitations.map((message, index) => ({ code: "PMF_LIMIT_" + index, message })),
      textFallback
    },
    _meta: { helixPmfScorecard: {
      inputsBase64: Buffer.from(JSON.stringify(select(literalInputs)), "utf8").toString("base64")
    } }
  };
}
