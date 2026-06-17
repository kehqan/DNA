// api/mcp.js — RFE/RL MCP Server (CommonJS, Vercel serverless)

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

// ── Create server instance ───────────────────────────────────────────────────
const server = new McpServer({
  name: "rferl-editorial-tools",
  version: "1.0.0",
});

// ── Tool: Search SharePoint KB ───────────────────────────────────────────────
server.tool(
  "search_kb",
  "Search the RFE/RL internal knowledge base on SharePoint for editorial guidelines, policies, templates, and frameworks",
  { query: z.string().describe("The search query") },
  async ({ query }) => {
    // TODO: replace with real SharePoint Search API call using Graph token
    // For now returns a placeholder so the tool registers and responds correctly
    return {
      content: [
        {
          type: "text",
          text: `Search results for "${query}" from RFE/RL SharePoint knowledge base. (SharePoint API integration pending — add Graph token here.)`,
        },
      ],
    };
  }
);

// ── Tool: Generate Editorial Briefing ────────────────────────────────────────
server.tool(
  "generate_brief",
  "Generate a structured editorial briefing for a given topic, following RFE/RL editorial standards",
  {
    topic: z.string().describe("The news topic or story to brief"),
    service: z.string().optional().describe("RFE/RL service or audience (e.g. Radio Farda, RFE)"),
    horizon: z.enum(["breaking", "developing", "background"]).optional().describe("Time horizon of the story"),
  },
  async ({ topic, service, horizon }) => {
    return {
      content: [
        {
          type: "text",
          text: `EDITORIAL BRIEFING — ${topic.toUpperCase()}
Service: ${service || "General"} · Horizon: ${horizon || "developing"}

SITUATION
[Agent should populate based on available internal sources]

KEY FACTS
• [Verifiable data point]
• [Timeline marker]
• [Legal or political designation if applicable]

SOURCING
[Where reliable information exists / where it is thin]

SENSITIVITIES
[Source risk · Audience safety · Legal · Disinfo flags]

ANGLES
1. [Primary reportable angle]
2. [Alternative frame or follow]`,
        },
      ],
    };
  }
);

// ── Tool: Verify Claim ────────────────────────────────────────────────────────
server.tool(
  "verify_claim",
  "Run a fact-check workflow on a specific claim, returning verification status and sourcing notes",
  {
    claim: z.string().describe("The exact claim text to verify"),
    source: z.string().optional().describe("The claimed source for this claim"),
  },
  async ({ claim, source }) => {
    return {
      content: [
        {
          type: "text",
          text: `CLAIM: ${claim}
SOURCE PROVIDED: ${source || "None supplied"}

VERIFICATION STATUS
[ ] VERIFIED
[ ] UNVERIFIED
[x] PENDING — requires cross-reference with internal sources

NOTES
No internal evidence retrieved yet. Connect SharePoint search to populate this field automatically.`,
        },
      ],
    };
  }
);

// ── Tool: Morning Briefing ────────────────────────────────────────────────────
server.tool(
  "morning_briefing",
  "Generate a structured morning briefing pulling from M365 calendar, inbox, Teams and SharePoint activity",
  {
    date: z.string().optional().describe("Date for the briefing in YYYY-MM-DD format, defaults to today"),
  },
  async ({ date }) => {
    const briefingDate = date || new Date().toISOString().split("T")[0];
    return {
      content: [
        {
          type: "text",
          text: `MORNING BRIEFING — ${briefingDate}

CALENDAR
• [Requires Microsoft Graph connection — calendar events will appear here]

INBOX PRIORITY
• [Requires Microsoft Graph connection — flagged emails will appear here]

TEAMS HIGHLIGHTS
• [Requires Microsoft Graph connection — @mentions and unread threads will appear here]

FILES UPDATED
• [Requires Microsoft Graph connection — recently modified SharePoint files will appear here]

NOTE
Connect this tool to Microsoft Graph API to populate live M365 data.`,
        },
      ],
    };
  }
);

// ── Vercel handler ────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  // Only accept POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed — MCP requires POST" });
  }

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless for Vercel serverless
    });

    // Clean up after response
    res.on("close", () => transport.close());

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP handler error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP server error", detail: err.message });
    }
  }
};
