import { config } from "dotenv";
import express from "express";
import cors from "cors";
import { paymentMiddleware } from "x402-express";
import healthRoutes from "./routes/health.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import toolRoutes from "./routes/tools.routes.js";
import testRoutes from "./routes/test.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { PAYMENT_CONFIG, getFacilitatorUrl, getPaymentAddress, isPaymentConfigured } from "./config/payment.config.js";

// Load environment variables
config();

const facilitatorUrl = getFacilitatorUrl();
const payTo = getPaymentAddress();

if (!isPaymentConfigured()) {
  console.log("⚠️  Payment not configured. Set FACILITATOR_URL and ADDRESS in .env file");
  console.log("⚠️  Server will run without payment requirements");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Payment middleware for tool endpoints (if configured)
if (facilitatorUrl && payTo) {
  console.log("💰 Payment middleware enabled for tool endpoints");
  app.use(
    paymentMiddleware(
      payTo,
      {
        "GET /mcp/calculate": PAYMENT_CONFIG.tools.calculate,
        "POST /mcp/calculate": PAYMENT_CONFIG.tools.calculate,
        "GET /mcp/weather": PAYMENT_CONFIG.tools.weather,
        "POST /mcp/weather": PAYMENT_CONFIG.tools.weather,
        "POST /mcp": PAYMENT_CONFIG.jsonRpc,
      },
      {
        url: facilitatorUrl,
      },
    ),
  );
}

// Routes
app.use("/", healthRoutes);
app.use("/mcp", mcpRoutes);
app.use("/mcp", toolRoutes);
app.use("/test", testRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 FluidSDK MCP Server");
  console.log("=".repeat(60));
  console.log(`\n📡 Server running on http://localhost:${PORT}`);
  
  // Payment status
  if (isPaymentConfigured()) {
    console.log(`\n💰 Payment: ENABLED (Coinbase x402)`);
    console.log(`   Network: base-sepolia`);
    console.log(`   Calculate: ${PAYMENT_CONFIG.tools.calculate.price}`);
    console.log(`   Weather: ${PAYMENT_CONFIG.tools.weather.price}`);
    console.log(`   JSON-RPC: ${PAYMENT_CONFIG.jsonRpc.price}`);
  } else {
    console.log(`\n💰 Payment: DISABLED (Configure .env to enable)`);
  }
  
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
  console.log(`\n🧪 Test Endpoints:`);
  console.log(`   GET  /test/interactive    - Interactive payment test UI`);
  console.log(`   GET  /test/payment-flow   - Payment flow documentation`);
  console.log(`   GET  /test/payment-info/:tool - Get payment details`);
  console.log(`   POST /test/verify-payment - Mock payment verification`);
  console.log(`   POST /test/protected-call - Simulate protected call`);
  console.log(`\n📚 Examples:`);
  console.log(`   GET  /mcp/calculate?operation=add&a=10&b=5`);
  console.log(`   GET  /mcp/weather?location=New York&unit=celsius`);
  console.log(`   GET  /test/interactive    - Open in browser for UI`);
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
