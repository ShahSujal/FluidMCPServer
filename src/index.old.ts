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
      initialize: "POST /mcp/initialize",
      tools: {
        list: "GET/POST /mcp/tools",
        calculate: "GET/POST /mcp/calculate",
        weather: "GET/POST /mcp/weather"
      },
      prompts: {
        list: "GET/POST /mcp/prompts"
      },
      resources: {
        list: "GET/POST /mcp/resources"
      },
      jsonRpc: "POST /mcp",
      health: "GET /health",
      info: "GET /info"
    },
    examples: {
      calculate: {
        get: "/mcp/calculate?operation=add&a=10&b=5",
        post: { url: "/mcp/calculate", body: { operation: "add", a: 10, b: 5 } }
      },
      weather: {
        get: "/mcp/weather?location=New York&unit=celsius",
        post: { url: "/mcp/weather", body: { location: "New York", unit: "celsius" } }
      }
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

// MCP Initialize endpoint
app.post("/mcp/initialize", async (req: Request, res: Response) => {
  console.log("� Handling initialize request");
  
  try {
    const { protocolVersion, capabilities, clientInfo } = req.body;
    console.log(`   Client: ${clientInfo?.name || "unknown"} v${clientInfo?.version || "unknown"}`);
    console.log(`   Protocol version: ${protocolVersion || "unknown"}`);

    const mcpServer = new MCPServer();
    const serverInfo = mcpServer.getServerInfo();

    return res.json({
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
    });
  } catch (error) {
    console.error("❌ Error in initialize:", error);
    return res.status(500).json({
      error: "Initialize failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Tools List - GET and POST
app.get("/mcp/tools", (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/tools - Listing tools");
  const mcpServer = new MCPServer();
  const tools = mcpServer.getTools();
  
  res.json({
    tools,
    count: tools.length
  });
});

app.post("/mcp/tools", (req: Request, res: Response) => {
  console.log("🔧 POST /mcp/tools - Listing tools");
  const mcpServer = new MCPServer();
  const tools = mcpServer.getTools();
  
  res.json({
    tools,
    count: tools.length
  });
});

// Prompts List - GET and POST
app.get("/mcp/prompts", (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/prompts - Listing prompts");
  const mcpServer = new MCPServer();
  const prompts = mcpServer.getPrompts();
  
  res.json({
    prompts,
    count: prompts.length
  });
});

app.post("/mcp/prompts", (req: Request, res: Response) => {
  console.log("🔧 POST /mcp/prompts - Listing prompts");
  const mcpServer = new MCPServer();
  const prompts = mcpServer.getPrompts();
  
  res.json({
    prompts,
    count: prompts.length
  });
});

// Resources List - GET and POST
app.get("/mcp/resources", (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/resources - Listing resources");
  const mcpServer = new MCPServer();
  const resources = mcpServer.getResources();
  
  res.json({
    resources,
    count: resources.length
  });
});

app.post("/mcp/resources", (req: Request, res: Response) => {
  console.log("🔧 POST /mcp/resources - Listing resources");
  const mcpServer = new MCPServer();
  const resources = mcpServer.getResources();
  
  res.json({
    resources,
    count: resources.length
  });
});

// Calculate Tool - GET and POST
app.get("/mcp/calculate", (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/calculate");
  const { operation, a, b } = req.query;
  
  if (!operation || !a || !b) {
    return res.status(400).json({
      error: "Missing parameters",
      required: ["operation", "a", "b"],
      example: "/mcp/calculate?operation=add&a=10&b=5"
    });
  }

  const mcpServer = new MCPServer();
  
  try {
    const result = mcpServer.callTool("calculate", {
      operation: operation as string,
      a: parseFloat(a as string),
      b: parseFloat(b as string)
    });
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: "Calculation failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post("/mcp/calculate", async (req: Request, res: Response) => {
  console.log("🔧 POST /mcp/calculate");
  const { operation, a, b } = req.body;
  
  if (!operation || a === undefined || b === undefined) {
    return res.status(400).json({
      error: "Missing parameters",
      required: ["operation", "a", "b"],
      example: { operation: "add", a: 10, b: 5 }
    });
  }

  const mcpServer = new MCPServer();
  
  try {
    const result = await mcpServer.callTool("calculate", { operation, a, b });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: "Calculation failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Weather Tool - GET and POST
app.get("/mcp/weather", async (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/weather");
  const { location, unit } = req.query;
  
  if (!location) {
    return res.status(400).json({
      error: "Missing location parameter",
      example: "/mcp/weather?location=New York&unit=celsius"
    });
  }

  const mcpServer = new MCPServer();
  
  try {
    const result = await mcpServer.callTool("get_weather", {
      location: location as string,
      unit: (unit as string) || "celsius"
    });
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: "Weather fetch failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post("/mcp/weather", async (req: Request, res: Response) => {
  console.log("🔧 POST /mcp/weather");
  const { location, unit } = req.body;
  
  if (!location) {
    return res.status(400).json({
      error: "Missing location parameter",
      example: { location: "New York", unit: "celsius" }
    });
  }

  const mcpServer = new MCPServer();
  
  try {
    const result = await mcpServer.callTool("get_weather", { location, unit: unit || "celsius" });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: "Weather fetch failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// MCP JSON-RPC endpoint (backward compatibility)
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

    const mcpServer = new MCPServer();

    // Handle initialize method
    if (method === "initialize") {
      const serverInfo = mcpServer.getServerInfo();
      return res.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
            prompts: { listChanged: false },
            resources: { subscribe: false, listChanged: false }
          },
          serverInfo: { name: serverInfo.name, version: serverInfo.version }
        },
        id
      });
    }

    // Handle tools/list method
    if (method === "tools/list") {
      return res.json({
        jsonrpc: "2.0",
        result: { tools: mcpServer.getTools() },
        id
      });
    }

    // Handle prompts/list method
    if (method === "prompts/list") {
      return res.json({
        jsonrpc: "2.0",
        result: { prompts: mcpServer.getPrompts() },
        id
      });
    }

    // Handle resources/list method
    if (method === "resources/list") {
      return res.json({
        jsonrpc: "2.0",
        result: { resources: mcpServer.getResources() },
        id
      });
    }

    // Handle tools/call method
    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params;
      if (!name) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32602, message: "Invalid params: 'name' is required" },
          id
        });
      }

      try {
        const result = await mcpServer.callTool(name, toolArgs || {});
        return res.json({ jsonrpc: "2.0", result, id });
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
      error: { code: -32601, message: `Method not implemented: ${method}` },
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
  console.log(`   GET  /                    - Server info and capabilities`);
  console.log(`   GET  /health              - Health check`);
  console.log(`   GET  /info                - Detailed information`);
  console.log(`\n🔧 MCP Protocol Endpoints:`);
  console.log(`   POST /mcp/initialize      - Initialize MCP connection`);
  console.log(`   GET  /mcp/tools           - List all tools`);
  console.log(`   POST /mcp/tools           - List all tools`);
  console.log(`   GET  /mcp/prompts         - List all prompts`);
  console.log(`   POST /mcp/prompts         - List all prompts`);
  console.log(`   GET  /mcp/resources       - List all resources`);
  console.log(`   POST /mcp/resources       - List all resources`);
  console.log(`\n⚙️  Tool Execution Endpoints:`);
  console.log(`   GET  /mcp/calculate       - Calculate (query: operation, a, b)`);
  console.log(`   POST /mcp/calculate       - Calculate (body: operation, a, b)`);
  console.log(`   GET  /mcp/weather         - Get weather (query: location, unit)`);
  console.log(`   POST /mcp/weather         - Get weather (body: location, unit)`);
  console.log(`\n🔌 JSON-RPC Endpoint:`);
  console.log(`   POST /mcp                 - JSON-RPC 2.0 (backward compatible)`);
  console.log(`   POST /mcp/sse             - MCP SSE transport endpoint`);
  console.log(`\n📚 Examples:`);
  console.log(`   GET  /mcp/calculate?operation=add&a=10&b=5`);
  console.log(`   GET  /mcp/weather?location=New York&unit=celsius`);
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
