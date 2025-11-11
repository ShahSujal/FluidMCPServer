# FluidSDK MCP Server

Production-ready Model Context Protocol server for FluidSDK agents. Deploy to Vercel, AWS, or any Node.js hosting platform.

## Features

- ✅ **4 Tools**: calculate, get_weather, echo, get_timestamp
- ✅ **3 Prompts**: greeting, code_review, debug_assistant
- ✅ **4 Resources**: config, status, docs/api, docs/quickstart
- ✅ **HTTP/SSE Support**: Production-ready with Server-Sent Events
- ✅ **CORS Enabled**: Ready for cross-origin requests
- ✅ **Health Checks**: Built-in health and status endpoints
- ✅ **TypeScript**: Full type safety
- ✅ **Vercel Ready**: One-click deployment

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Server will run on `http://localhost:3000`

### Test the Server

```bash
# Check server info
curl http://localhost:3000/

# Health check
curl http://localhost:3000/health

# Get detailed info
curl http://localhost:3000/info
```

## API Endpoints

### GET /
Server information and capabilities overview

```json
{
  "name": "FluidSDK MCP Server",
  "version": "1.0.0",
  "status": "healthy",
  "endpoints": {
    "mcp": "/mcp",
    "health": "/health",
    "info": "/info"
  },
  "capabilities": {
    "tools": [...],
    "prompts": [...],
    "resources": [...]
  }
}
```

### GET /health
Health check endpoint for monitoring

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-11-11T08:00:00.000Z"
}
```

### GET /info
Detailed server information and capabilities

### POST /mcp
Main MCP protocol endpoint using Server-Sent Events (SSE)

## Capabilities

### Tools (Executable Functions)

1. **calculate**
   - Perform mathematical operations (add, subtract, multiply, divide)
   - Input: `{ operation, a, b }`
   - Output: Calculation result

2. **get_weather**
   - Get weather information for a location
   - Input: `{ location, unit? }`
   - Output: Weather data (mock)

3. **echo**
   - Echo back a message
   - Input: `{ message }`
   - Output: Echoed message

4. **get_timestamp**
   - Get current timestamp in various formats
   - Input: `{ format? }`
   - Output: Formatted timestamp

### Prompts (Templates)

1. **greeting**
   - Generate personalized greetings
   - Args: `name`, `time_of_day`

2. **code_review**
   - Code review request templates
   - Args: `language`, `complexity`

3. **debug_assistant**
   - Debugging assistance prompts
   - Args: `error_type`

### Resources (Data Access)

1. **fluidsdk://config** - Server configuration
2. **fluidsdk://status** - Real-time server status
3. **fluidsdk://docs/api** - API documentation
4. **fluidsdk://docs/quickstart** - Quick start guide

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd mcp-server
vercel
```

### Option 2: GitHub Integration

1. Push this folder to GitHub
2. Import repository in Vercel dashboard
3. Set root directory to `mcp-server`
4. Deploy!

### Environment Variables (Optional)

```bash
PORT=3000  # Port number (default: 3000)
```

## Deploy to Other Platforms

### Heroku

```bash
# Create Heroku app
heroku create your-mcp-server

# Deploy
git subtree push --prefix mcp-server heroku main
```

### AWS Lambda / API Gateway

Use the Serverless framework or AWS SAM to deploy as a Lambda function.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Usage with FluidSDK

```typescript
import { FluidSDK } from "fluidsdk";

// Create agent with your deployed MCP server
const agent = sdk.createAgent("My Agent", "Description", "image");
await agent.setMCP("https://your-mcp-server.vercel.app/mcp");
await agent.registerIPFS();

// Agent is now discoverable with MCP capabilities!
```

## Testing with MCP Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("https://your-mcp-server.vercel.app/mcp")
);

const client = new Client({
  name: "test-client",
  version: "1.0.0",
}, { capabilities: {} });

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool({
  name: "calculate",
  arguments: { operation: "add", a: 10, b: 20 }
});
console.log(result);
```

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts       # Express server with HTTP/SSE
│   └── server.ts      # MCP server core logic
├── dist/              # Compiled JavaScript (generated)
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## Development

### Adding New Tools

Edit `src/server.ts` and add to the tools array:

```typescript
{
  name: "your_tool",
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: { ... },
    required: [...]
  }
}
```

Then implement the handler in `handleTool` method.

### Adding New Prompts

Add to the prompts array and implement handler in `handlePrompt` method.

### Adding New Resources

Add to the resources array and implement handler in `handleResource` method.

## Monitoring

Once deployed, monitor your server:

```bash
# Check health
curl https://your-mcp-server.vercel.app/health

# View logs (Vercel)
vercel logs

# View metrics (Vercel Dashboard)
# Analytics → Functions → /mcp
```

## Security

For production deployments:

1. **Add Authentication**: Implement API key or OAuth
2. **Rate Limiting**: Use middleware to prevent abuse
3. **Input Validation**: Validate all tool inputs
4. **CORS Configuration**: Restrict origins as needed
5. **Error Handling**: Don't expose sensitive error details

Example with API key:

```typescript
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

## Support

- Documentation: https://docs.fluidsdk.io
- GitHub Issues: https://github.com/yourusername/fluidsdk
- Discord: https://discord.gg/fluidsdk

## License

MIT
