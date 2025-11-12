import { Router, Request, Response } from "express";
import { MCPServer } from "../server.js";

const router = Router();

// Calculate Tool - GET and POST
router.get("/calculate", async (req: Request, res: Response) => {
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
    const mcpResult = await mcpServer.callTool("calculate", {
      operation: operation as string,
      a: parseFloat(a as string),
      b: parseFloat(b as string)
    });
    
    // Extract the actual result from MCP format
    const textContent = mcpResult.content[0].text;
    const result = JSON.parse(textContent);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      error: "Calculation failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post("/calculate", async (req: Request, res: Response) => {
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
    const mcpResult = await mcpServer.callTool("calculate", { operation, a, b });
    
    // Extract the actual result from MCP format
    const textContent = mcpResult.content[0].text;
    const result = JSON.parse(textContent);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      error: "Calculation failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Weather Tool - GET and POST
router.get("/weather", async (req: Request, res: Response) => {
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
    const mcpResult = await mcpServer.callTool("get_weather", {
      location: location as string,
      unit: (unit as string) || "celsius"
    });
    
    // Extract the actual result from MCP format
    const textContent = mcpResult.content[0].text;
    const result = JSON.parse(textContent);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      error: "Weather fetch failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post("/weather", async (req: Request, res: Response) => {
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
    const mcpResult = await mcpServer.callTool("get_weather", { location, unit: unit || "celsius" });
    
    // Extract the actual result from MCP format
    const textContent = mcpResult.content[0].text;
    const result = JSON.parse(textContent);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      error: "Weather fetch failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
