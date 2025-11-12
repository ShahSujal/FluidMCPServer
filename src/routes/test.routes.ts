import { Router, Request, Response } from "express";
import { PAYMENT_CONFIG } from "../config/payment.config.js";

const router = Router();

// Test endpoint to simulate x402 payment flow
router.get("/test/payment-flow", (req: Request, res: Response) => {
  res.json({
    message: "X402 Payment Flow Test",
    instructions: {
      step1: "Make a request to a protected endpoint without payment",
      step2: "Receive x402 error response with payment details",
      step3: "Create payment transaction on blockchain",
      step4: "Include X-PAYMENT header in retry request",
      step5: "Receive successful response"
    },
    example: {
      protectedEndpoint: "GET http://localhost:3000/mcp/calculate?operation=add&a=10&b=5",
      expectedError: {
        x402Version: 1,
        error: "X-PAYMENT header is required",
        accepts: [
          {
            scheme: "exact",
            network: "base-sepolia",
            maxAmountRequired: "1000",
            resource: "http://localhost:3000/mcp/calculate",
            payTo: process.env.ADDRESS || "0xYourWalletAddress",
            asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            extra: {
              name: "USDC",
              version: "2"
            }
          }
        ]
      },
      paymentHeader: {
        description: "Include this header after payment",
        header: "X-PAYMENT",
        value: "base64-encoded-payment-proof"
      }
    },
    testEndpoints: {
      calculate: {
        url: "GET /mcp/calculate?operation=add&a=10&b=5",
        price: PAYMENT_CONFIG.tools.calculate.price,
        network: PAYMENT_CONFIG.tools.calculate.network
      },
      weather: {
        url: "GET /mcp/weather?location=NewYork&unit=celsius",
        price: PAYMENT_CONFIG.tools.weather.price,
        network: PAYMENT_CONFIG.tools.weather.network
      }
    }
  });
});

// Test endpoint - Mock payment verification
router.post("/test/verify-payment", (req: Request, res: Response) => {
  const { paymentProof, endpoint, amount } = req.body;

  if (!paymentProof || !endpoint || !amount) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["paymentProof", "endpoint", "amount"]
    });
  }

  // Mock verification
  res.json({
    verified: true,
    paymentProof,
    endpoint,
    amount,
    message: "Payment verified (mock)",
    nextStep: "Include X-PAYMENT header in your request",
    example: {
      header: "X-PAYMENT",
      value: paymentProof
    }
  });
});

// Test endpoint - Simulate protected call
router.post("/test/protected-call", (req: Request, res: Response) => {
  const paymentHeader = req.headers['x-payment'];
  const { endpoint, params } = req.body;

  if (!paymentHeader) {
    return res.status(402).json({
      x402Version: 1,
      error: "X-PAYMENT header is required",
      accepts: [
        {
          scheme: "exact",
          network: "base-sepolia",
          maxAmountRequired: "1000",
          resource: `http://localhost:3000${endpoint}`,
          description: "Payment required for this resource",
          payTo: process.env.ADDRESS || "0x38C867005D271Eb8Ea68F262ac64F1Bf336Ee2cf",
          maxTimeoutSeconds: 60,
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          outputSchema: {
            input: {
              type: "http",
              method: "GET",
              discoverable: true
            }
          },
          extra: {
            name: "USDC",
            version: "2"
          }
        }
      ]
    });
  }

  // Mock successful response
  res.json({
    success: true,
    paymentVerified: true,
    endpoint,
    params,
    result: {
      message: "Payment accepted - request processed",
      data: {
        example: "This would be the actual API response"
      }
    }
  });
});

// Test endpoint - Get payment requirements
router.get("/test/payment-info/:tool", (req: Request, res: Response) => {
  const { tool } = req.params;
  
  const toolConfig = PAYMENT_CONFIG.tools[tool as keyof typeof PAYMENT_CONFIG.tools];
  
  if (!toolConfig) {
    return res.status(404).json({
      error: "Tool not found",
      availableTools: Object.keys(PAYMENT_CONFIG.tools)
    });
  }

  res.json({
    tool,
    price: toolConfig.price,
    network: toolConfig.network,
    paymentDetails: {
      x402Version: 1,
      scheme: "exact",
      network: toolConfig.network,
      payTo: process.env.ADDRESS || "0x38C867005D271Eb8Ea68F262ac64F1Bf336Ee2cf",
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      assetDetails: {
        name: "USDC",
        version: "2",
        decimals: 6
      },
      priceInUSDC: toolConfig.price,
      maxTimeoutSeconds: 60
    },
    howToUse: {
      step1: `Make request to /mcp/${tool}`,
      step2: "Receive 402 error with payment details",
      step3: "Create payment transaction",
      step4: "Include X-PAYMENT header",
      step5: "Retry request - success!"
    }
  });
});

// Interactive test page
router.get("/test/interactive", (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>X402 Payment Test - MCP Server</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .test-section {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        .endpoint {
            background: #e8f5e9;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            font-family: monospace;
        }
        .error-response {
            background: #fff3e0;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #ff9800;
        }
        .success-response {
            background: #e8f5e9;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        button {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
        }
        button:hover { background: #45a049; }
        button.secondary {
            background: #2196F3;
        }
        button.secondary:hover {
            background: #0b7dda;
        }
        pre {
            background: #263238;
            color: #aed581;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-weight: bold;
        }
        .status.enabled { background: #c8e6c9; color: #2e7d32; }
        .status.disabled { background: #ffccbc; color: #d84315; }
        .price { color: #4CAF50; font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 X402 Payment Test Interface</h1>
        <p>Interactive testing for Coinbase x402 payment-protected endpoints</p>
        
        <div class="status ${process.env.ADDRESS ? 'enabled' : 'disabled'}">
            Payment Status: ${process.env.ADDRESS ? '✅ ENABLED' : '❌ DISABLED (Configure .env)'}
        </div>

        <div class="test-section">
            <h2>📊 Payment Configuration</h2>
            <p><strong>Network:</strong> base-sepolia</p>
            <p><strong>Payment Address:</strong> <code>${process.env.ADDRESS || 'Not configured'}</code></p>
            <p><strong>USDC Token:</strong> <code>0x036CbD53842c5426634e7929541eC2318f3dCF7e</code></p>
            
            <h3>Pricing:</h3>
            <ul>
                <li>Calculate: <span class="price">${PAYMENT_CONFIG.tools.calculate.price}</span></li>
                <li>Weather: <span class="price">${PAYMENT_CONFIG.tools.weather.price}</span></li>
                <li>Echo: <span class="price">${PAYMENT_CONFIG.tools.echo.price}</span></li>
                <li>Timestamp: <span class="price">${PAYMENT_CONFIG.tools.timestamp.price}</span></li>
            </ul>
        </div>

        <div class="test-section">
            <h2>🧪 Test Endpoints</h2>
            
            <h3>1. Calculate Tool</h3>
            <div class="endpoint">
                GET /mcp/calculate?operation=add&a=10&b=5
            </div>
            <button onclick="testCalculate()">Test Calculate</button>
            <button class="secondary" onclick="getPaymentInfo('calculate')">Get Payment Info</button>
            <div id="calculate-result"></div>

            <h3>2. Weather Tool</h3>
            <div class="endpoint">
                GET /mcp/weather?location=NewYork&unit=celsius
            </div>
            <button onclick="testWeather()">Test Weather</button>
            <button class="secondary" onclick="getPaymentInfo('weather')">Get Payment Info</button>
            <div id="weather-result"></div>
        </div>

        <div class="test-section">
            <h2>📖 X402 Flow Example</h2>
            <pre>
Step 1: Client makes request without payment
→ GET /mcp/calculate?operation=add&a=10&b=5

Step 2: Server responds with 402 Payment Required
→ {
    "x402Version": 1,
    "error": "X-PAYMENT header is required",
    "accepts": [{
        "network": "base-sepolia",
        "payTo": "${process.env.ADDRESS || '0x...'}",
        "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        "maxAmountRequired": "1000"
    }]
}

Step 3: Client creates payment transaction

Step 4: Client retries with X-PAYMENT header
→ GET /mcp/calculate?operation=add&a=10&b=5
→ Header: X-PAYMENT: <payment-proof>

Step 5: Server verifies and responds
→ { "result": ... }
            </pre>
        </div>

        <div class="test-section">
            <h2>🔗 API Endpoints</h2>
            <ul>
                <li><code>GET /test/payment-flow</code> - Payment flow documentation</li>
                <li><code>GET /test/payment-info/:tool</code> - Get payment details for tool</li>
                <li><code>POST /test/verify-payment</code> - Mock payment verification</li>
                <li><code>POST /test/protected-call</code> - Simulate protected call</li>
            </ul>
        </div>
    </div>

    <script>
        async function testCalculate() {
            const resultDiv = document.getElementById('calculate-result');
            resultDiv.innerHTML = '<p>Loading...</p>';
            
            try {
                const response = await fetch('/mcp/calculate?operation=add&a=10&b=5');
                const data = await response.json();
                
                if (response.status === 402) {
                    resultDiv.innerHTML = \`
                        <div class="error-response">
                            <h4>402 Payment Required</h4>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="success-response">
                            <h4>Success!</h4>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`<div class="error-response">Error: \${error.message}</div>\`;
            }
        }

        async function testWeather() {
            const resultDiv = document.getElementById('weather-result');
            resultDiv.innerHTML = '<p>Loading...</p>';
            
            try {
                const response = await fetch('/mcp/weather?location=NewYork&unit=celsius');
                const data = await response.json();
                
                if (response.status === 402) {
                    resultDiv.innerHTML = \`
                        <div class="error-response">
                            <h4>402 Payment Required</h4>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="success-response">
                            <h4>Success!</h4>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`<div class="error-response">Error: \${error.message}</div>\`;
            }
        }

        async function getPaymentInfo(tool) {
            const resultDiv = document.getElementById(tool + '-result');
            resultDiv.innerHTML = '<p>Loading payment info...</p>';
            
            try {
                const response = await fetch(\`/test/payment-info/\${tool}\`);
                const data = await response.json();
                
                resultDiv.innerHTML = \`
                    <div class="success-response">
                        <h4>Payment Information for \${tool}</h4>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    </div>
                \`;
            } catch (error) {
                resultDiv.innerHTML = \`<div class="error-response">Error: \${error.message}</div>\`;
            }
        }
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

export default router;
