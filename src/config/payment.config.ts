import { Resource, type SolanaAddress } from "x402-express";

export const PAYMENT_CONFIG = {
  // Tool pricing in USD
  tools: {
    calculate: {
      price: "$0.001",
      network: "base-sepolia" as const,
    },
    weather: {
      price: "$0.002", 
      network: "base-sepolia" as const,
    },
    echo: {
      price: "$0.0005",
      network: "base-sepolia" as const,
    },
    timestamp: {
      price: "$0.0005",
      network: "base-sepolia" as const,
    },
  },
  
  // JSON-RPC endpoint pricing
  jsonRpc: {
    price: "$0.005",
    network: "base-sepolia" as const,
  },
};

// Helper to get facilitator URL from env
export const getFacilitatorUrl = (): Resource | undefined => {
  return process.env.FACILITATOR_URL as Resource | undefined;
};

// Helper to get payment address from env
export const getPaymentAddress = (): (`0x${string}` | SolanaAddress) | undefined => {
  return process.env.ADDRESS as (`0x${string}` | SolanaAddress) | undefined;
};

// Helper to check if payment is configured
export const isPaymentConfigured = (): boolean => {
  return !!(getFacilitatorUrl() && getPaymentAddress());
};
