import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export declare const SERVER_NAME = "craft-gtm-mcp";
export declare const SERVER_VERSION = "2.2.24";
export declare const listedTools: {
    title: string;
    annotations: {
        title: string;
        readOnlyHint: boolean;
        destructiveHint: boolean;
        openWorldHint: boolean;
    };
    inputSchema: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    };
    name: string;
    description?: string | undefined;
    outputSchema?: {
        [x: string]: unknown;
        type: "object";
        properties?: {
            [x: string]: object;
        } | undefined;
        required?: string[] | undefined;
    } | undefined;
    execution?: {
        taskSupport?: "optional" | "required" | "forbidden" | undefined;
    } | undefined;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
    icons?: {
        src: string;
        mimeType?: string | undefined;
        sizes?: string[] | undefined;
        theme?: "light" | "dark" | undefined;
    }[] | undefined;
}[];
export declare function createServer(): Server;
//# sourceMappingURL=server.d.ts.map