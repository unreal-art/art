/**
 * Application Configuration
 * Contains centralized configuration values for the application
 * Sensitive values are read from environment variables
 */

export const appConfig = {
  // App metadata
  app: {
    name: "Unreal",
    description: "AI media generation tool",
    version: "1.0.0",
    buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || "v1.0.0",
    debug: process.env.NEXT_PUBLIC_DEBUG === "true",
    highlightProjectId:
      process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID || "4g88269g",
    newUserCredit: Number(process.env.NEXT_PUBLIC_NEW_USER_CREDIT || 5),
  },

  // Environment-specific configurations
  environment: {
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    baseUrl:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://art.unreal.art",
  },

  // External services
  services: {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SRK: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    odp: {
      apiKey: process.env.ODP_API_KEY,
      apiEndpoint:
        "https://hi6socfuab.execute-api.ap-southeast-1.amazonaws.com/engagepoints",
    },
    lighthouse: {
      gateway:
        process.env.NEXT_PUBLIC_LIGHTHOUSE_GATE_WAY ||
        "https://gateway.lighthouse.storage/ipfs/",
    },
    thirdweb: {
      clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID || "",
    },
    api: {
      url: "https://ideomind.decenterai.com",
      odpEndpoint:
        "https://hi6socfuab.execute-api.ap-southeast-1.amazonaws.com/engagepoints",
    },
    cloudflare: {
      url: process.env.NEXT_PUBLIC_CF_URL,
      r2Endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || "",
      r2BucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || "",
      r2AccessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
      r2SecretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
      r2Url: process.env.CLOUDFLARE_R2_URL || "",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
  },

  // Blockchain configuration
  blockchain: {
    supportedChains: ["torusMainnet", "torusTestnet"],
    defaultChain: "torusMainnet",
    rpcUrls: {
      torusTestnet:
        process.env.TORUS_TESTNET_RPC_URL ||
        "https://rpc.testnet.toruschain.com",
      torusMainnet:
        process.env.TORUS_MAINNET_RPC_URL || "https://rpc.toruschain.com",
      ethereum: process.env.ETHEREUM_RPC_URL as string,
      polygon: process.env.POLYGON_RPC_URL as string,
      bsc: process.env.BSC_RPC_URL as string,
      sepolia: process.env.SEPOLIA_RPC_URL as string,
      polygonAmoy: process.env.POLYGON_AMOY_RPC_URL as string,
      bscTestnet: process.env.BSC_TESTNET_RPC_URL as string,
    },
    contracts: {
      dart: "0x37719927bbf857b4e2c0195aee74e7b3f1161a77",
      odpTestnet: "0xc1c3ed9a297da8dc89f9f56c42a8549203df5262",
      odpMainnet: "0xFF47178dAE98Cb1D61c0e46f38EB68bEa5BDE284",
      exchange: "0x5b807e61094c6c59321E11b3EcFD727D8f587eeE",
      treasury: "0x823531B7c7843D8c3821B19D70cbFb6173b9Cb02",
      odpPartner:
        process.env.NEXT_PUBLIC_ODP_PARTNER ||
        "0x0e4cC613300F22Cf86CC018397Dd57956e65a0e5", //FIXME: its DecenterAI : on 15th July 2025 revert
      spender: "0xa6095e20d2A2a79e36322aaC39339eECb9e6C861",
    },
    tokens: {
      // Testnet tokens
      testnet: {
        sepolia: {
          usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        },
        polygonAmoy: {
          usdc: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
        },
        bnbTestnet: {
          usdc: "0x64544969ed7EBf5f083679233325356EbE738930",
        },
      },
      // Mainnet tokens
      mainnet: {
        ethereum: {
          usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        },
        polygon: {
          usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
          usdt: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
        },
        bnb: {
          usdc: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
          usdt: "0x55d398326f99059ff775485246999027b3197955",
        },
        torus: {
          unreal: "0xA409B5E5D34928a0F1165c7a73c8aC572D1aBCDB",
        },
      },
    },
    rates: {
      // TODO: try to use ethers library here makes things readable and usable
      standard: process.env.NEXT_PUBLIC_RATE || "300000000000000000000", // 300 tokens
      stableCoin:
        process.env.NEXT_PUBLIC_STABLE_COIN_RATE || "100000000000000000", // 0.1 tokens
      odp: process.env.NEXT_PUBLIC_ODP_RATE || "300000000000000000000", // 300 tokens
    },
    // Network timeouts and retry configurations
    rpcTimeout: 10000, // ms
    maxRetries: 3,
  },

  // UI Configuration
  ui: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ["image/jpeg", "image/png", "image/gif"],
    defaultProfileImage: "/images/default-avatar.png",
  },

  // API endpoints that aren't secrets
  endpoints: {
    apiBase: "/api",
    graphqlEndpoint: "/api/graphql",
  },

  // Feature flags
  features: {
    enableWalletConnect: true,
    enableProfileEditing: true,
    enableGallerySharing: true,
  },
}

export default appConfig
