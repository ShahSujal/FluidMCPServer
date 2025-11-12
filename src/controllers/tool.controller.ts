import { MCPServer } from "../server.js";

export class ToolController {
  private mcpServer: MCPServer;

  constructor() {
    this.mcpServer = new MCPServer();
  }

  async calculate(operation: string, a: number, b: number) {
    return await this.mcpServer.callTool("calculate", { operation, a, b });
  }

  async getWeather(location: string, unit: string = "celsius") {
    return await this.mcpServer.callTool("get_weather", { location, unit });
  }

  async echo(message: string) {
    return await this.mcpServer.callTool("echo", { message });
  }

  async getTimestamp(format: string = "iso") {
    return await this.mcpServer.callTool("get_timestamp", { format });
  }
}
