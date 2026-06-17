// api/mcp.js (Vercel serverless function)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const server = new McpServer({ name: "rferl-tools", version: "1.0" });

// Register a tool — e.g. search SharePoint KB
server.tool("search_kb", "Search the RFE/RL knowledge base", 
  { query: z.string() },
  async ({ query }) => {
    // call SharePoint search API here
    return { content: [{ type: "text", text: results }] };
  }
);

// Register more tools: generate_brief, verify_claim, morning_briefing...

export default async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ req, res });
  await server.connect(transport);
};
