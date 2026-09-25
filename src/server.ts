// Shared MCP server definition, used by both entry points:
//   src/index.ts                 stdio (the npm package)
//   netlify/functions/mcp.mjs    Streamable HTTP (the hosted connector)
// The tool dispatch below is unchanged from the published version; this file adds
// tool titles and annotations, and a clear message when a required input is missing.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { tools } from "./tools.js";
import { generatePMFScorecard } from "./pmf-scorecard.js";
import { generateLaunchCommander } from "./launch-commander.js";
import { generateCustomerInterviewKit } from "./interview-kit.js";
import { generateRetentionPlaybook } from "./retention-playbook.js";
import { generatePartnerArchitect } from "./partner-architect.js";
import { generateCrisisPlanner } from "./crisis-planner.js";
import { generateCompetitiveIntel } from "./competitive-intel.js";
import { generateCRAFTAnalyzer } from "./craft-analyzer.js";

export const SERVER_NAME = "craft-gtm-mcp";
export const SERVER_VERSION = "2.2.0";

// Every tool only builds text from its inputs: no storage, no network, no side effects.
const TOOL_TITLES: Record<string, string> = {
  "pmf_scorecard": "PMF Scorecard",
  "launch_commander": "Launch Commander",
  "customer_interview_kit": "Customer Interview Kit",
  "retention_playbook": "Retention Playbook",
  "partner_architect": "Partner Architect",
  "crisis_planner": "Crisis Planner",
  "competitive_intel": "Competitive Intel",
  "craft_gtm_analyzer": "CRAFT GTM Analyzer"
};

export const listedTools = tools.map((tool) => {
  const title = TOOL_TITLES[tool.name] ?? tool.name;
  return {
    ...tool,
    title,
    annotations: {
      title,
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  };
});

// Decision N2 (run 6, extended after the independent check): numbers inside lists and objects follow their schema's
// minimum and maximum too, and a text field that holds one amount (AMOUNT_TEXT) cannot hold a negative amount.
type SchemaNode = { type?: string; minimum?: number; maximum?: number; properties?: Record<string, SchemaNode>; items?: SchemaNode };
const NEGATIVE_AMOUNT = /(^|[\s(:=])[-\u2212]\$\s*\d|\$\s*[-\u2212]\s*\d|^\s*[-\u2212]\s*\d/;
function checkLimits(schema: SchemaNode, value: unknown, path: string, problems: string[]): void {
  if (schema.properties && value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, p] of Object.entries(schema.properties)) {
      checkLimits(p, (value as Record<string, unknown>)[key], path ? `${path}.${key}` : key, problems);
    }
    return;
  }
  if (schema.items && Array.isArray(value)) {
    value.forEach((item, i) => checkLimits(schema.items as SchemaNode, item, `${path}[${i}]`, problems));
    return;
  }
  if (schema.type !== "number" && schema.type !== "integer") return;
  const v = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof v !== "number" || !Number.isFinite(v)) return;
  if (typeof schema.minimum === "number" && v < schema.minimum) problems.push(`${path} must be ${schema.minimum} or more`);
  if (typeof schema.maximum === "number" && v > schema.maximum) problems.push(`${path} must be ${schema.maximum} or less`);
}

const AMOUNT_TEXT: Record<string, string[]> = { pmf_scorecard: ["current_metrics"], partner_architect: ["your_deal_size"] };

function checkRequiredInputs(
  name: string,
  args: Record<string, unknown> | undefined
): string | null {
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return `Unknown tool: ${name}. Available tools: ${tools.map((t) => t.name).join(", ")}.`;
  }
  const required = ((tool.inputSchema as { required?: string[] }).required ?? []) as string[];
  const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null);
  if (missing.length > 0) {
    return `Missing required input for ${name}: ${missing.join(", ")}. Provide ${missing.length === 1 ? "it" : "them"} and call the tool again.`;
  }
  // Decision N2 (run 6): amounts, counts and durations cannot be negative; the schema says which (minimum, maximum).
  const problems: string[] = [];
  checkLimits(tool.inputSchema as unknown as SchemaNode, args ?? {}, "", problems);
  for (const key of AMOUNT_TEXT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && NEGATIVE_AMOUNT.test(raw)) problems.push(`${key} must not contain a negative amount`);
  }
  if (problems.length > 0) {
    return `Invalid input for ${name}: ${problems.join("; ")}.`;
  }
  return null;
}

export function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: listedTools };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const problem = checkRequiredInputs(name, args as Record<string, unknown> | undefined);
    if (problem) {
      return { content: [{ type: "text", text: problem }], isError: true };
    }

    try {
      let result: string;

      switch (name) {
        case "pmf_scorecard":
          result = generatePMFScorecard(args as Parameters<typeof generatePMFScorecard>[0]);
          break;
        case "launch_commander":
          result = generateLaunchCommander(args as Parameters<typeof generateLaunchCommander>[0]);
          break;
        case "customer_interview_kit":
          result = generateCustomerInterviewKit(args as Parameters<typeof generateCustomerInterviewKit>[0]);
          break;
        case "retention_playbook":
          result = generateRetentionPlaybook(args as Parameters<typeof generateRetentionPlaybook>[0]);
          break;
        case "partner_architect":
          result = generatePartnerArchitect(args as Parameters<typeof generatePartnerArchitect>[0]);
          break;
        case "crisis_planner":
          result = generateCrisisPlanner(args as Parameters<typeof generateCrisisPlanner>[0]);
          break;
        case "competitive_intel":
          result = generateCompetitiveIntel(args as Parameters<typeof generateCompetitiveIntel>[0]);
          break;
        case "craft_gtm_analyzer":
          result = generateCRAFTAnalyzer(args as Parameters<typeof generateCRAFTAnalyzer>[0]);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
