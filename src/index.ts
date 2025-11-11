import express, { Request, Response } from "express";
import cors from "cors";
import { MCPServer } from "./server.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "FluidSDK MCP Server",
    version: "1.0.0",
    status: "healthy",
    endpoints: {
      mcp: "/mcp",
      health: "/health",
      info: "/info",
    },
    capabilities: {
      tools: ["calculate", "get_weather", "echo", "get_timestamp"],
      prompts: ["greeting", "code_review", "debug_assistant"],
      resources: ["config", "status", "docs/api", "docs/quickstart"],
    },
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/info", (req: Request, res: Response) => {
  res.json({
    name: "FluidSDK MCP Server",
    version: "1.0.0",
    protocol: "Model Context Protocol",
    description: "MCP server providing tools, prompts, and resources for FluidSDK agents",
    capabilities: {
      tools: {
        calculate: "Perform mathematical calculations",
        get_weather: "Get weather information",
        echo: "Echo messages",
        get_timestamp: "Get current timestamp",
      },
      prompts: {
        greeting: "Generate greetings",
        code_review: "Code review templates",
        debug_assistant: "Debugging assistance",
      },
      resources: {
        config: "Server configuration",
        status: "Server status",
        "docs/api": "API documentation",
        "docs/quickstart": "Quick start guide",
      },
    },
    documentation: "https://docs.fluidsdk.io",
  });
});

// MCP JSON-RPC endpoint for initialize and other methods
app.post("/mcp", async (req: Request, res: Response) => {
  console.log("📨 MCP JSON-RPC request received");

  try {
    const { jsonrpc, method, params, id } = req.body;

    // Validate JSON-RPC request
    if (jsonrpc !== "2.0") {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid Request: jsonrpc must be '2.0'"
        },
        id: id || null
      });
    }

    // Create MCP server instance
    const mcpServer = new MCPServer();

    // Handle initialize method
    if (method === "initialize") {
      console.log("🔧 Handling initialize request");
      console.log(`   Client: ${params?.clientInfo?.name || "unknown"} v${params?.clientInfo?.version || "unknown"}`);
      console.log(`   Protocol version: ${params?.protocolVersion || "unknown"}`);

      const serverInfo = mcpServer.getServerInfo();

      return res.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {
              listChanged: false
            },
            prompts: {
              listChanged: false
            },
            resources: {
              subscribe: false,
              listChanged: false
            }
          },
          serverInfo: {
            name: serverInfo.name,
            version: serverInfo.version
          }
        },
        id
      });
    }

    // Handle tools/list method
    if (method === "tools/list") {
      console.log("🔧 Handling tools/list request");
      const tools = mcpServer.getTools();
      
      return res.json({
        jsonrpc: "2.0",
        result: {
          tools
        },
        id
      });
    }

    // Handle prompts/list method
    if (method === "prompts/list") {
      console.log("🔧 Handling prompts/list request");
      const prompts = mcpServer.getPrompts();
      
      return res.json({
        jsonrpc: "2.0",
        result: {
          prompts
        },
        id
      });
    }

    // Handle resources/list method
    if (method === "resources/list") {
      console.log("🔧 Handling resources/list request");
      const resources = mcpServer.getResources();
      
      return res.json({
        jsonrpc: "2.0",
        result: {
          resources
        },
        id
      });
    }

    // Handle tools/call method
    if (method === "tools/call") {
      console.log("🔧 Handling tools/call request");
      const { name, arguments: toolArgs } = params;
      
      if (!name) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32602,
            message: "Invalid params: 'name' is required"
          },
          id
        });
      }

      try {
        const result = await mcpServer.callTool(name, toolArgs || {});
        
        return res.json({
          jsonrpc: "2.0",
          result,
          id
        });
      } catch (error) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32602,
            message: error instanceof Error ? error.message : String(error)
          },
          id
        });
      }
    }

    // Handle other methods
    return res.status(501).json({
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: `Method not implemented: ${method}`
      },
      id
    });

  } catch (error) {
    console.error("❌ Error handling MCP request:", error);
    return res.status(500).json({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal error",
        data: error instanceof Error ? error.message : String(error)
      },
      id: req.body?.id || null
    });
  }
});

// MCP SSE endpoint (alternative transport)
app.post("/mcp/sse", async (req: Request, res: Response) => {
  console.log("📨 MCP SSE connection request received");

  try {
    // Create new MCP server instance for this connection
    const mcpServer = new MCPServer();
    const server = mcpServer.getServer();

    // Set up SSE transport
    const transport = new SSEServerTransport("/messages", res);

    // Handle connection close
    res.on("close", () => {
      console.log("🔌 MCP SSE connection closed");
    });

    // Connect server to transport
    await server.connect(transport);
    console.log("✅ MCP server connected via SSE");
  } catch (error) {
    console.error("❌ Error setting up MCP SSE connection:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to establish MCP SSE connection",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 FluidSDK MCP Server");
  console.log("=".repeat(60));
  console.log(`\n📡 Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   GET  /           - Server info and capabilities`);
  console.log(`   GET  /health     - Health check`);
  console.log(`   GET  /info       - Detailed information`);
  console.log(`   POST /mcp        - MCP JSON-RPC endpoint (initialize, etc.)`);
  console.log(`   POST /mcp/sse    - MCP SSE transport endpoint`);
  console.log(`\n🔧 Capabilities:`);
  console.log(`   Tools:     calculate, get_weather, echo, get_timestamp`);
  console.log(`   Prompts:   greeting, code_review, debug_assistant`);
  console.log(`   Resources: config, status, docs/api, docs/quickstart`);
  console.log("\n" + "=".repeat(60) + "\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received, shutting down gracefully...");
  process.exit(0);
});
