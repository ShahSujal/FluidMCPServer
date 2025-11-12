import { MCPServer } from "../server.js";

export class MCPController {
  private mcpServer: MCPServer;

  constructor() {
    this.mcpServer = new MCPServer();
  }

  getServerInfo() {
    return this.mcpServer.getServerInfo();
  }

  getTools() {
    return this.mcpServer.getTools();
  }

  getPrompts() {
    return this.mcpServer.getPrompts();
  }

  getResources() {
    return this.mcpServer.getResources();
  }

  async callTool(name: string, args: any) {
    return await this.mcpServer.callTool(name, args);
  }

  getServer() {
    return this.mcpServer.getServer();
  }
}
