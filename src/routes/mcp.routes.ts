import { Router, Request, Response } from "express";
import { MCPServer } from "../server.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { PAYMENT_CONFIG } from "../config/payment.config.js";

const router = Router();

// MCP Initialize endpoint
router.post("/initialize", async (req: Request, res: Response) => {
  console.log("🔧 Handling initialize request");
  
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

// Tools List - GET only
router.get("/tools", (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/tools - Listing tools");
  const mcpServer = new MCPServer();
  const tools = mcpServer.getTools();
  
  // Pricing map with token and chainId info
  const pricingMap: Record<string, { 
    price: string; 
    network: string;
    tokens: Array<{ address: string; symbol: string; decimals: number }>;
    chainId: number;
  }> = {
    calculate: {
      ...PAYMENT_CONFIG.tools.calculate,
      tokens: [
        { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6 }
      ],
      chainId: 84532
    },
    get_weather: {
      ...PAYMENT_CONFIG.tools.weather,
      tokens: [
        { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6 }
      ],
      chainId: 84532
    },
    echo: {
      ...PAYMENT_CONFIG.tools.echo,
      tokens: [
        { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6 }
      ],
      chainId: 84532
    },
    get_timestamp: {
      ...PAYMENT_CONFIG.tools.timestamp,
      tokens: [
        { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6 }
      ],
      chainId: 84532
    },
  };
  
  // Transform to simplified format with pricing
  const simplifiedTools = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    endpoint: `/mcp/${tool.name === 'get_weather' ? 'weather' : tool.name === 'get_timestamp' ? 'timestamp' : tool.name}`,
    parameters: tool.inputSchema.properties ? 
      Object.entries(tool.inputSchema.properties).map(([key, value]: [string, any]) => ({
        name: key,
        type: value.type,
        description: value.description,
        required: (tool.inputSchema.required as string[] | undefined)?.includes(key) || false,
        enum: value.enum || undefined
      })) : [],
    pricing: pricingMap[tool.name] || { 
      price: "$0.1", 
      network: "base-sepolia",
      tokens: [
        { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6 }
      ],
      chainId: 84532
    }
  }));
  
  res.json(simplifiedTools);
});

// Prompts List - GET only
router.get("/prompts", (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/prompts - Listing prompts");
  const mcpServer = new MCPServer();
  const prompts = mcpServer.getPrompts();
  
  // Transform to simplified format
  const simplifiedPrompts = prompts.map(prompt => ({
    name: prompt.name,
    description: prompt.description,
    parameters: prompt.arguments?.map(arg => ({
      name: arg.name,
      description: arg.description,
      required: arg.required
    })) || []
  }));
  
  res.json(simplifiedPrompts);
});

// Resources List - GET only
router.get("/resources", (req: Request, res: Response) => {
  console.log("🔧 GET /mcp/resources - Listing resources");
  const mcpServer = new MCPServer();
  const resources = mcpServer.getResources();
  
  // Return simplified format
  const simplifiedResources = resources.map(resource => ({
    name: resource.name,
    uri: resource.uri,
    description: resource.description,
    mimeType: resource.mimeType
  }));
  
  res.json(simplifiedResources);
});

// MCP JSON-RPC endpoint (backward compatibility)
router.post("/", async (req: Request, res: Response) => {
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
router.post("/sse", async (req: Request, res: Response) => {
  console.log("📨 MCP SSE connection request received");

  try {
    const mcpServer = new MCPServer();
    const server = mcpServer.getServer();

    const transport = new SSEServerTransport("/messages", res);

    res.on("close", () => {
      console.log("🔌 MCP SSE connection closed");
    });

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

export default router;
