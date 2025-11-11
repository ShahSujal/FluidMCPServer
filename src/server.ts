import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * FluidSDK MCP Server Core
 * Provides tools, prompts, and resources for AI agents
 */
export class MCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "fluidsdk-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Tools Handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "calculate",
            description: "Perform basic mathematical calculations (add, subtract, multiply, divide)",
            inputSchema: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  enum: ["add", "subtract", "multiply", "divide"],
                  description: "The mathematical operation to perform",
                },
                a: {
                  type: "number",
                  description: "First number",
                },
                b: {
                  type: "number",
                  description: "Second number",
                },
              },
              required: ["operation", "a", "b"],
            },
          },
          {
            name: "get_weather",
            description: "Get mock weather information for a location",
            inputSchema: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "City name or coordinates",
                },
                unit: {
                  type: "string",
                  enum: ["celsius", "fahrenheit"],
                  description: "Temperature unit",
                },
              },
              required: ["location"],
            },
          },
          {
            name: "echo",
            description: "Echo back the input message",
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "Message to echo back",
                },
              },
              required: ["message"],
            },
          },
          {
            name: "get_timestamp",
            description: "Get current timestamp in various formats",
            inputSchema: {
              type: "object",
              properties: {
                format: {
                  type: "string",
                  enum: ["iso", "unix", "locale"],
                  description: "Timestamp format",
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "calculate":
          return this.handleCalculate(args as any);
        case "get_weather":
          return this.handleWeather(args as any);
        case "echo":
          return this.handleEcho(args as any);
        case "get_timestamp":
          return this.handleTimestamp(args as any);
        default:
          return {
            content: [
              {
                type: "text",
                text: `Error: Unknown tool ${name}`,
              },
            ],
          };
      }
    });

    // Prompts Handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: "greeting",
            description: "Generate a friendly greeting message",
            arguments: [
              {
                name: "name",
                description: "Name of the person to greet",
                required: true,
              },
              {
                name: "time_of_day",
                description: "Time of day (morning, afternoon, evening)",
                required: false,
              },
            ],
          },
          {
            name: "code_review",
            description: "Generate a code review prompt template",
            arguments: [
              {
                name: "language",
                description: "Programming language",
                required: true,
              },
              {
                name: "complexity",
                description: "Code complexity level (low, medium, high)",
                required: false,
              },
            ],
          },
          {
            name: "debug_assistant",
            description: "Generate a debugging assistance prompt",
            arguments: [
              {
                name: "error_type",
                description: "Type of error (syntax, runtime, logical)",
                required: true,
              },
            ],
          },
        ],
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "greeting":
          return this.handleGreetingPrompt(args);
        case "code_review":
          return this.handleCodeReviewPrompt(args);
        case "debug_assistant":
          return this.handleDebugPrompt(args);
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });

    // Resources Handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "fluidsdk://config",
            name: "Server Configuration",
            description: "Current MCP server configuration",
            mimeType: "application/json",
          },
          {
            uri: "fluidsdk://status",
            name: "Server Status",
            description: "Real-time server health and metrics",
            mimeType: "application/json",
          },
          {
            uri: "fluidsdk://docs/api",
            name: "API Documentation",
            description: "FluidSDK API reference",
            mimeType: "text/markdown",
          },
          {
            uri: "fluidsdk://docs/quickstart",
            name: "Quick Start Guide",
            description: "Getting started with FluidSDK",
            mimeType: "text/markdown",
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case "fluidsdk://config":
          return this.handleConfigResource();
        case "fluidsdk://status":
          return this.handleStatusResource();
        case "fluidsdk://docs/api":
          return this.handleApiDocsResource();
        case "fluidsdk://docs/quickstart":
          return this.handleQuickstartResource();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  // Tool Implementations
  private handleCalculate(args: { operation: string; a: number; b: number }) {
    const { operation, a, b } = args;
    let result: number;

    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Division by zero is not allowed",
              },
            ],
          };
        }
        result = a / b;
        break;
      default:
        return {
          content: [
            {
              type: "text",
              text: `Error: Unknown operation ${operation}`,
            },
          ],
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            operation,
            operands: [a, b],
            result,
            expression: `${a} ${operation} ${b} = ${result}`,
          }, null, 2),
        },
      ],
    };
  }

  private handleWeather(args: { location: string; unit?: string }) {
    const { location, unit = "celsius" } = args;
    const temp = Math.floor(Math.random() * 30) + 10;
    const conditions = ["Sunny", "Cloudy", "Rainy", "Windy", "Partly Cloudy"];

    const mockWeather = {
      location,
      temperature: unit === "fahrenheit" ? temp * 1.8 + 32 : temp,
      unit: unit === "fahrenheit" ? "°F" : "°C",
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 60) + 40,
      wind_speed: Math.floor(Math.random() * 20) + 5,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(mockWeather, null, 2),
        },
      ],
    };
  }

  private handleEcho(args: { message: string }) {
    return {
      content: [
        {
          type: "text",
          text: `Echo: ${args.message}`,
        },
      ],
    };
  }

  private handleTimestamp(args: { format?: string }) {
    const now = new Date();
    const format = args.format || "iso";

    let timestamp: string | number;
    switch (format) {
      case "unix":
        timestamp = Math.floor(now.getTime() / 1000);
        break;
      case "locale":
        timestamp = now.toLocaleString();
        break;
      case "iso":
      default:
        timestamp = now.toISOString();
        break;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            format,
            timestamp,
            raw: now.toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  // Prompt Implementations
  private handleGreetingPrompt(args: any) {
    const name = args?.name || "User";
    const timeOfDay = args?.time_of_day || "day";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Good ${timeOfDay}, ${name}! Welcome to FluidSDK. I'm your AI assistant powered by the Model Context Protocol. How can I help you today?`,
          },
        },
      ],
    };
  }

  private handleCodeReviewPrompt(args: any) {
    const language = args?.language || "JavaScript";
    const complexity = args?.complexity || "medium";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please review the following ${language} code with ${complexity} complexity.

Focus Areas:
1. **Code Quality**: Best practices and design patterns
2. **Security**: Potential vulnerabilities or security issues
3. **Performance**: Optimization opportunities
4. **Maintainability**: Readability and documentation
5. **Testing**: Test coverage and edge cases

Provide specific, actionable feedback with examples where appropriate.`,
          },
        },
      ],
    };
  }

  private handleDebugPrompt(args: any) {
    const errorType = args?.error_type || "runtime";

    const prompts: Record<string, string> = {
      syntax: "I'm encountering a syntax error. Please help me identify and fix the syntax issue in my code.",
      runtime: "I'm experiencing a runtime error. Please help me debug this issue by analyzing the error message and stack trace.",
      logical: "My code runs without errors but produces incorrect results. Please help me identify the logical error.",
    };

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: prompts[errorType] || prompts.runtime,
          },
        },
      ],
    };
  }

  // Resource Implementations
  private handleConfigResource() {
    return {
      contents: [
        {
          uri: "fluidsdk://config",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              serverName: "fluidsdk-mcp-server",
              version: "1.0.0",
              capabilities: ["tools", "prompts", "resources"],
              tools: ["calculate", "get_weather", "echo", "get_timestamp"],
              prompts: ["greeting", "code_review", "debug_assistant"],
              resources: ["config", "status", "docs/api", "docs/quickstart"],
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private handleStatusResource() {
    return {
      contents: [
        {
          uri: "fluidsdk://status",
          mimeType: "application/json",
          text: JSON.stringify(
            {
              status: "healthy",
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              platform: process.platform,
              nodeVersion: process.version,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private handleApiDocsResource() {
    return {
      contents: [
        {
          uri: "fluidsdk://docs/api",
          mimeType: "text/markdown",
          text: `# FluidSDK API Reference

## Core Classes

### FluidSDK
Main SDK class for interacting with the Agent0 protocol.

\`\`\`typescript
const sdk = new FluidSDK({
  chainId: 11155111,
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
  signer: wallet,
  ipfs: "pinata",
  pinataJwt: "YOUR-PINATA-JWT"
});
\`\`\`

### Agent
Represents an on-chain agent with capabilities.

\`\`\`typescript
const agent = sdk.createAgent("My Agent", "Description", "image-uri");
await agent.setMCP("https://your-mcp-server.com");
await agent.registerIPFS();
\`\`\`

## Methods

### createAgent(name, description, image)
Create a new agent instance.

### searchAgents(params, sort, pageSize, cursor)
Search for agents with filters.

### giveFeedback(agentId, feedbackFile, feedbackAuth)
Submit feedback for an agent.

For more details, visit: https://docs.fluidsdk.io
`,
        },
      ],
    };
  }

  private handleQuickstartResource() {
    return {
      contents: [
        {
          uri: "fluidsdk://docs/quickstart",
          mimeType: "text/markdown",
          text: `# FluidSDK Quick Start Guide

## Installation

\`\`\`bash
npm install fluidsdk
\`\`\`

## Setup

\`\`\`typescript
import { FluidSDK } from "fluidsdk";
import { ethers } from "ethers";

// Create wallet
const wallet = new ethers.Wallet("YOUR-PRIVATE-KEY");

// Initialize SDK
const sdk = new FluidSDK({
  chainId: 11155111, // Sepolia testnet
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
  signer: wallet
});
\`\`\`

## Create and Register an Agent

\`\`\`typescript
// Create agent
const agent = sdk.createAgent(
  "My First Agent",
  "A test agent for FluidSDK",
  "ipfs://QmYourImageHash"
);

// Add MCP endpoint
await agent.setMCP("https://your-mcp-server.com");

// Register on blockchain
await agent.registerIPFS();

console.log("Agent registered with ID:", agent.agentId);
\`\`\`

## Give Feedback

\`\`\`typescript
const feedbackFile = sdk.prepareFeedback(
  agentId,
  5, // score
  ["helpful", "accurate"],
  "Great agent!"
);

await sdk.giveFeedback(agentId, feedbackFile);
\`\`\`

## Next Steps

- Explore agent search and discovery
- Implement feedback collection
- Deploy your MCP server
- Join our community

Visit https://docs.fluidsdk.io for full documentation.
`,
        },
      ],
    };
  }

  getServer(): Server {
    return this.server;
  }

  getServerInfo() {
    return {
      name: "fluidsdk-mcp-server",
      version: "1.0.0"
    };
  }

  getTools() {
    return [
      {
        name: "calculate",
        description: "Perform basic mathematical calculations (add, subtract, multiply, divide)",
        inputSchema: {
          type: "object",
          properties: {
            operation: {
              type: "string",
              enum: ["add", "subtract", "multiply", "divide"],
              description: "The mathematical operation to perform",
            },
            a: {
              type: "number",
              description: "First number",
            },
            b: {
              type: "number",
              description: "Second number",
            },
          },
          required: ["operation", "a", "b"],
        },
      },
      {
        name: "get_weather",
        description: "Get mock weather information for a location",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "City name or coordinates",
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "Temperature unit",
            },
          },
          required: ["location"],
        },
      },
      {
        name: "echo",
        description: "Echo back the input message",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Message to echo back",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "get_timestamp",
        description: "Get current timestamp in various formats",
        inputSchema: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["iso", "unix", "locale"],
              description: "Timestamp format",
            },
          },
          required: [],
        },
      },
    ];
  }

  getPrompts() {
    return [
      {
        name: "greeting",
        description: "Generate a friendly greeting message",
        arguments: [
          {
            name: "name",
            description: "Name of the person to greet",
            required: true,
          },
          {
            name: "time_of_day",
            description: "Time of day (morning, afternoon, evening)",
            required: false,
          },
        ],
      },
      {
        name: "code_review",
        description: "Generate a code review prompt template",
        arguments: [
          {
            name: "language",
            description: "Programming language",
            required: true,
          },
          {
            name: "complexity",
            description: "Code complexity level (low, medium, high)",
            required: false,
          },
        ],
      },
      {
        name: "debug_assistant",
        description: "Generate a debugging assistance prompt",
        arguments: [
          {
            name: "error_type",
            description: "Type of error (syntax, runtime, logical)",
            required: true,
          },
        ],
      },
    ];
  }

  getResources() {
    return [
      {
        uri: "fluidsdk://config",
        name: "Server Configuration",
        description: "Current MCP server configuration",
        mimeType: "application/json",
      },
      {
        uri: "fluidsdk://status",
        name: "Server Status",
        description: "Real-time server health and metrics",
        mimeType: "application/json",
      },
      {
        uri: "fluidsdk://docs/api",
        name: "API Documentation",
        description: "FluidSDK API reference",
        mimeType: "text/markdown",
      },
      {
        uri: "fluidsdk://docs/quickstart",
        name: "Quick Start Guide",
        description: "Getting started with FluidSDK",
        mimeType: "text/markdown",
      },
    ];
  }

  async callTool(name: string, args: any) {
    switch (name) {
      case "calculate":
        return this.handleCalculate(args);
      case "get_weather":
        return this.handleWeather(args);
      case "echo":
        return this.handleEcho(args);
      case "get_timestamp":
        return this.handleTimestamp(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
