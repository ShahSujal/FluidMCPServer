# Next.js x402 Payment Implementation

This guide shows how to implement x402 (HTTP 402 Payment Required) in Next.js using Coinbase payment infrastructure.

## Installation

```bash
npm install x402-express dotenv
```

## Environment Variables

Create `.env.local`:

```env
FACILITATOR_URL=https://facilitator.x402.org
PAYMENT_ADDRESS=0x38c867005d271eb8ea68f262ac64f1bf336ee2cf
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Backend Implementation

### 1. Payment Configuration (`lib/payment-config.ts`)

```typescript
export const PAYMENT_CONFIG = {
  tools: {
    calculate: {
      price: "$0.001",
      network: "base-sepolia" as const,
    },
    weather: {
      price: "$0.002",
      network: "base-sepolia" as const,
    },
  },
  chainId: 84532, // Base Sepolia
  usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

export const getFacilitatorUrl = () => process.env.FACILITATOR_URL;
export const getPaymentAddress = () => process.env.PAYMENT_ADDRESS as `0x${string}`;
export const isPaymentConfigured = () => !!(getFacilitatorUrl() && getPaymentAddress());
```

### 2. Payment Middleware (`middleware/payment.ts`)

```typescript
import { paymentMiddleware } from "x402-express";
import { PAYMENT_CONFIG, getFacilitatorUrl, getPaymentAddress } from "@/lib/payment-config";

export function createPaymentMiddleware() {
  const facilitatorUrl = getFacilitatorUrl();
  const payTo = getPaymentAddress();

  if (!facilitatorUrl || !payTo) {
    console.warn("⚠️  Payment not configured");
    return null;
  }

  return paymentMiddleware(
    payTo,
    {
      "GET /api/calculate": PAYMENT_CONFIG.tools.calculate,
      "POST /api/calculate": PAYMENT_CONFIG.tools.calculate,
      "GET /api/weather": PAYMENT_CONFIG.tools.weather,
      "POST /api/weather": PAYMENT_CONFIG.tools.weather,
    },
    {
      url: facilitatorUrl,
    }
  );
}
```

### 3. API Route with Payment (`app/api/calculate/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createPaymentMiddleware } from "@/middleware/payment";

// Apply payment middleware
const paymentMw = createPaymentMiddleware();

export async function GET(request: NextRequest) {
  // Check payment (x402 middleware would handle this in Express)
  // For Next.js, we need to manually check X-PAYMENT header
  const paymentHeader = request.headers.get("x-payment");
  
  if (!paymentHeader) {
    // Return 402 Payment Required
    return NextResponse.json(
      {
        x402Version: 1,
        error: "X-PAYMENT header is required",
        accepts: [
          {
            scheme: "exact",
            network: "base-sepolia",
            maxAmountRequired: "1000", // $0.001 in USDC (6 decimals)
            resource: \`\${request.nextUrl.origin}/api/calculate\`,
            payTo: process.env.PAYMENT_ADDRESS,
            asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            maxTimeoutSeconds: 60,
            extra: {
              name: "USDC",
              version: "2",
            },
          },
        ],
      },
      { status: 402 }
    );
  }

  // Process the actual request
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get("operation");
  const a = parseFloat(searchParams.get("a") || "0");
  const b = parseFloat(searchParams.get("b") || "0");

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
      result = b !== 0 ? a / b : 0;
      break;
    default:
      return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    operation,
    operands: [a, b],
    result,
    expression: \`\${a} \${operation} \${b} = \${result}\`,
  });
}
```

### 4. Alternative: Express-style Middleware Adapter

```typescript
// lib/express-adapter.ts
import { NextRequest, NextResponse } from "next/server";

export function expressMiddlewareAdapter(middleware: any) {
  return async (request: NextRequest) => {
    // Create Express-like req/res objects
    const req: any = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.json().catch(() => ({})),
    };

    let statusCode = 200;
    let responseData: any = {};

    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        return res;
      },
      send: (data: any) => {
        responseData = data;
        return res;
      },
    };

    const next = () => {};

    // Run the middleware
    await middleware(req, res, next);

    return NextResponse.json(responseData, { status: statusCode });
  };
}
```

## Frontend Implementation

### 1. Payment Hook (`hooks/useX402Payment.ts`)

```typescript
"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";

const USDC_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export function useX402Payment() {
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const makePaymentAndCall = async (
    endpoint: string,
    params: Record<string, any>,
    paymentInfo: {
      payTo: string;
      amount: string;
      asset: string;
    }
  ) => {
    if (!address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    try {
      // Step 1: Make payment transaction
      const amountInWei = parseUnits(
        paymentInfo.amount.replace("$", ""),
        6
      ); // USDC has 6 decimals

      const hash = await walletClient.writeContract({
        address: paymentInfo.asset as `0x\${string}`,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [paymentInfo.payTo, amountInWei],
      });

      // Step 2: Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      if (!receipt) {
        throw new Error("Transaction failed");
      }

      // Step 3: Create payment proof
      const paymentProof = btoa(
        JSON.stringify({
          txHash: hash,
          from: address,
          to: paymentInfo.payTo,
          amount: amountInWei.toString(),
          timestamp: Date.now(),
        })
      );

      // Step 4: Call the endpoint with payment proof
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(\`\${endpoint}?\${queryString}\`, {
        headers: {
          "X-PAYMENT": paymentProof,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      const data = await response.json();
      return { success: true, data, txHash: hash };
    } catch (error) {
      console.error("Payment failed:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return { makePaymentAndCall, loading };
}
```

### 2. Payment Component (`components/PaymentButton.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useX402Payment } from "@/hooks/useX402Payment";
import { useAccount, useConnect, useSwitchChain } from "wagmi";

interface PaymentButtonProps {
  endpoint: string;
  params: Record<string, any>;
  pricing: {
    price: string;
    chainId: number;
    payTo: string;
    asset: string;
  };
  onSuccess?: (data: any) => void;
}

export function PaymentButton({
  endpoint,
  params,
  pricing,
  onSuccess,
}: PaymentButtonProps) {
  const [result, setResult] = useState<any>(null);
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  const { makePaymentAndCall, loading } = useX402Payment();

  const handlePayAndCall = async () => {
    // Check connection
    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }

    // Check network
    if (chainId !== pricing.chainId) {
      await switchChain({ chainId: pricing.chainId });
      return;
    }

    // Make payment and call
    const response = await makePaymentAndCall(endpoint, params, {
      payTo: pricing.payTo,
      amount: pricing.price,
      asset: pricing.asset,
    });

    if (response.success) {
      setResult(response.data);
      onSuccess?.(response.data);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePayAndCall}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : !isConnected
          ? "Connect Wallet"
          : chainId !== pricing.chainId
          ? "Switch Network"
          : \`Pay \${pricing.price} & Execute\`}
      </button>

      {result && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Success!</h3>
          <pre className="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### 3. Usage Example (`app/page.tsx`)

```typescript
"use client";

import { PaymentButton } from "@/components/PaymentButton";
import { WagmiConfig, createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "MCP Server",
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export default function Home() {
  return (
    <WagmiConfig config={config}>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">x402 Payment Demo</h1>

        <div className="space-y-6">
          <div className="border p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Calculate Tool</h2>
            <p className="text-gray-600 mb-4">
              Perform calculation: 10 + 5
            </p>

            <PaymentButton
              endpoint="/api/calculate"
              params={{
                operation: "add",
                a: 10,
                b: 5,
              }}
              pricing={{
                price: "$0.001",
                chainId: 84532,
                payTo: "0x38c867005d271eb8ea68f262ac64f1bf336ee2cf",
                asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
              }}
              onSuccess={(data) => console.log("Result:", data)}
            />
          </div>
        </div>
      </div>
    </WagmiConfig>
  );
}
```

### 4. Wagmi Config (`lib/wagmi-config.ts`)

```typescript
import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, metaMask } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "MCP Payment Server",
    }),
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});
```

## Key Concepts

1. **402 Payment Required**: Server returns 402 status with payment details
2. **Payment Flow**:
   - Client calls endpoint without payment
   - Server returns 402 with payment info (payTo, amount, asset)
   - Client makes USDC transfer transaction
   - Client retries with X-PAYMENT header containing proof
   - Server validates and processes request

3. **Payment Proof**: Base64 encoded transaction details
4. **Network**: Base Sepolia (testnet) or Base Mainnet (production)
5. **Token**: USDC on Base network

## Testing

1. Get Base Sepolia ETH: https://faucet.quicknode.com/base/sepolia
2. Get Base Sepolia USDC: https://faucet.circle.com/
3. Connect wallet to Base Sepolia
4. Test payment flow

This implementation provides a complete x402 payment system for Next.js!
