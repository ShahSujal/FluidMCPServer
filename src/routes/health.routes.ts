import { Router, Request, Response } from "express";
import { MCPServer } from "../server.js";
import { isPaymentConfigured, PAYMENT_CONFIG } from "../config/payment.config.js";

const router = Router();

// Root endpoint - Server info
router.get("/", (req: Request, res: Response) => {
  res.json({
    name: "FluidSDK MCP Server",
    version: "1.0.0",
    status: "healthy",
    paymentEnabled: isPaymentConfigured(),
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
    pricing: isPaymentConfigured() ? {
      calculate: PAYMENT_CONFIG.tools.calculate.price,
      weather: PAYMENT_CONFIG.tools.weather.price,
      echo: PAYMENT_CONFIG.tools.echo.price,
      timestamp: PAYMENT_CONFIG.tools.timestamp.price,
      jsonRpc: PAYMENT_CONFIG.jsonRpc.price,
      network: "base-sepolia"
    } : null,
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

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Info endpoint
router.get("/info", (req: Request, res: Response) => {
  res.json({
    name: "FluidSDK MCP Server",
    version: "1.0.0",
    protocol: "Model Context Protocol",
    description: "MCP server providing tools, prompts, and resources for FluidSDK agents",
    paymentEnabled: isPaymentConfigured(),
    paymentNetwork: isPaymentConfigured() ? "base-sepolia" : null,
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
    pricing: isPaymentConfigured() ? {
      tools: {
        calculate: PAYMENT_CONFIG.tools.calculate.price,
        weather: PAYMENT_CONFIG.tools.weather.price,
        echo: PAYMENT_CONFIG.tools.echo.price,
        timestamp: PAYMENT_CONFIG.tools.timestamp.price,
      },
      jsonRpc: PAYMENT_CONFIG.jsonRpc.price,
    } : null,
    documentation: "https://docs.fluidsdk.io",
  });
});

export default router;
