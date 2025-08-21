# DeFi Cross-Chain Swap API

A robust, provider-agnostic API for cross-chain cryptocurrency swaps and bridging, built with NestJS and TypeScript. This modular architecture enables seamless integration with multiple DeFi aggregators without requiring extensive refactoring when adding new providers.

## 🚀 Features

- **Provider-Agnostic Architecture**: Unified interface regardless of underlying swap provider
- **Cross-Chain Support**: Execute swaps between different blockchain networks
- **Type-Safe Implementation**: Full TypeScript support with comprehensive validation
- **Rate Limiting**: Built-in request throttling to prevent abuse
- **Comprehensive Validation**: Custom validators for addresses, amounts, and chain compatibility
- **Error Standardization**: Consistent error responses across all providers
- **Health Monitoring**: Health check endpoints for service monitoring
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Gas Abstraction**: Support for paymaster-enabled gasless transactions

## 📋 Supported Features

### Transaction Types
- **Cross-Chain Swaps**: Exchange tokens across different blockchain networks
- **Gas Abstraction**: Execute transactions without native gas tokens (via paymaster)
- **Slippage Protection**: Configurable slippage tolerance (0.1% - 50%)
- **Custom Recipients**: Send swapped tokens to different addresses

### Blockchain Networks
- **Ethereum** (Chain ID: 1)
- **Optimism** (Chain ID: 10) 
- **Polygon** (Chain ID: 137)
- **Arbitrum One** (Chain ID: 42161)
- **Base** (Chain ID: 8453)

### Provider Integration
Currently integrated with **Swaps.xyz** aggregator, with architecture designed for easy addition of new providers.

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd defi-api

# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env with your configuration
```

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=4001
BIND_ADDR=0.0.0.0
PATH_PREFIX=

# CORS Configuration  
CORS_ORIGIN=*

# Swaps.xyz Provider Configuration
SWAPS_ENABLED=true
SWAPS_API_KEY=your_swaps_api_key_here
SWAPS_BASE_URL_ACTION=https://api-v2.swaps.xyz/api
SWAPS_BASE_URL_STATUS=https://ghost.swaps.xyz/api/v2
SWAPS_PRIORITY=1
```

## 🚀 Usage

### Start the Server

```bash
# Development mode
yarn dev

# Production build
yarn build
yarn start:prod

# Debug mode
yarn start:debug
```

### API Endpoints

#### Core Swap Operations

**Get Available Providers**
```bash
GET /swap/providers
```

**Prepare Cross-Chain Transaction**
```bash
GET /swap/transaction?actionType=swap&sender=0x...&sourceChain=1&destinationChain=137&sourceToken=0x...&destinationToken=0x...&amount=1000000000000000000&slippage=1
```

**Check Transaction Status**
```bash
GET /swap/status?txHash=0x...
```

#### Health & Monitoring

**Health Check**
```bash
GET /health
```

### Example Usage

**Swap ETH to MATIC (Ethereum → Polygon)**
```bash
curl -X GET "http://localhost:4001/swap/transaction" \
  -G \
  -d "actionType=swap" \
  -d "sender=0x742d35cc6635c0532925a3b8d8323434bd3e2b5f" \
  -d "sourceChain=1" \
  -d "destinationChain=137" \
  -d "sourceToken=0x0000000000000000000000000000000000000000" \
  -d "destinationToken=0x0000000000000000000000000000000000001010" \
  -d "amount=1000000000000000000" \
  -d "slippage=1"
```

**Check Transaction Status**
```bash
curl -X GET "http://localhost:4001/swap/status" \
  -G \
  -d "txHash=0x1234567890abcdef1234567890abcdef12345678"
```

## 📚 API Documentation

Once the server is running, visit `http://localhost:4001/api` for interactive Swagger documentation with detailed endpoint specifications and request/response schemas.

## 🧪 Testing

```bash
# Run unit tests
yarn test

# Run tests in watch mode  
yarn test:watch

# Generate coverage report
yarn test:cov

# Run end-to-end tests
yarn test:e2e

# Debug tests
yarn test:debug
```

## 🏗️ Architecture

### Core Components

1. **Provider Interface**: Abstract `ISwapProvider` interface for consistent provider implementation
2. **Provider Registry**: Dynamic provider registration and automatic selection
3. **Unified Types**: Standardized request/response types across all providers  
4. **Validation Layer**: Custom validators for addresses, amounts, and chain compatibility
5. **Error Handling**: Centralized error management with consistent error codes
6. **Rate Limiting**: Request throttling per client IP address

### Adding New Providers

To integrate a new swap provider:

1. **Implement Provider Interface**
```typescript
@Injectable()
export class NewProvider implements ISwapProvider {
  readonly providerId = 'new-provider';
  readonly name = 'New Provider';
  readonly supportedChains = [1, 137, 42161];

  // Implement required methods...
  async prepareTransaction(request: UnifiedTransactionRequest): Promise<UnifiedTransactionResponse> {
    // Provider-specific implementation
  }
}
```

2. **Add Configuration**: Update environment variables and configuration
3. **Register Provider**: Add to the provider registry in swap module
4. **Update Types**: Add provider-specific types if needed

## 🔒 Security Features

- **Input Validation**: Comprehensive validation of all request parameters
- **Rate Limiting**: Configurable request limits per client
- **Address Validation**: Ethereum address format verification
- **Chain Validation**: Ensure supported blockchain networks
- **Amount Validation**: Verify transaction amounts are valid
- **Error Sanitization**: Safe error responses without sensitive information

## 📊 Error Codes

The API uses standardized error codes for consistent error handling:

- `INVALID_PARAMETERS`: Invalid request parameters
- `PROVIDER_ERROR`: Provider-specific error occurred
- `PROVIDER_NOT_FOUND`: Requested provider not available
- `PROVIDER_DISABLED`: Provider is currently disabled
- `INSUFFICIENT_LIQUIDITY`: Not enough liquidity for the trade
- `UNSUPPORTED_ROUTE`: Route not supported by any provider
- `RATE_LIMIT_EXCEEDED`: Request rate limit exceeded
- `TRANSACTION_NOT_FOUND`: Transaction not found
- `VALIDATION_ERROR`: Request validation failed
- `NETWORK_ERROR`: Network/API communication error

## 🔧 Development

### Project Structure

```
src/
├── controllers/          # API route handlers
├── services/            # Business logic services  
├── providers/           # Swap provider implementations
├── dto/                 # Data transfer objects
├── types/               # TypeScript type definitions
├── validators/          # Custom validation decorators
├── guards/              # Rate limiting and security
├── interceptors/        # Logging and monitoring
├── errors/              # Error handling classes
└── config/              # Configuration management
```

### Code Quality

```bash
# Lint code
yarn lint

# Format code  
yarn format

# Type checking
yarn build
```

## 📄 License

This project is licensed under the UNLICENSED license - see the package.json file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

For support and questions, please refer to the API documentation at `/api` when the server is running, or check the project's issue tracker.