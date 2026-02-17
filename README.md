![Astreus](assets/intro.webp)

CLI tool to scaffold new Astreus AI agent projects with best practices and sensible defaults.

[![npm version](https://badge.fury.io/js/create-astreus-agent.svg)](https://badge.fury.io/js/create-astreus-agent)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Usage

```bash
# Using npx (recommended)
npx create-astreus-agent my-agent

# Using npm
npm create astreus-agent my-agent

# Using pnpm
pnpm create astreus-agent my-agent
```

## What's Included

The generated project includes:

```
my-agent/
├── src/
│   ├── index.ts      # Main entry point
│   └── agent.ts      # Agent configuration
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Options

```bash
# Create with specific template
npx create-astreus-agent my-agent --template basic

# Create with specific model
npx create-astreus-agent my-agent --model gpt-4o

# Create with memory enabled
npx create-astreus-agent my-agent --memory

# Create with knowledge base
npx create-astreus-agent my-agent --knowledge
```

## Templates

| Template | Description |
|----------|-------------|
| `basic` | Simple agent with minimal configuration |
| `assistant` | Conversational assistant with memory |
| `rag` | RAG-enabled agent with knowledge base |
| `tools` | Agent with custom tool integrations |

## Getting Started

After creating your project:

```bash
cd my-agent
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

## Related Packages

- [@astreus-ai/astreus](https://github.com/astreus-ai/astreus) - Core AI agent framework
- [@astreus-ai/astreus-cli](https://github.com/astreus-ai/astreus-cli) - Interactive terminal interface

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Astreus Team - [https://astreus.org](https://astreus.org)

Project Link: [https://github.com/astreus-ai/create-astreus-agent](https://github.com/astreus-ai/create-astreus-agent)
