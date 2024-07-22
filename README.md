# Token 2022 Bot

## Overview

Token 2022 Bot is a Solana-based project designed to automatically airdrop tokens whenever SOL is transferred to the owner's wallet. This bot leverages the Solana blockchain's capabilities to ensure seamless and automated token distribution.

## Features

- **Automatic Airdrop**: Automatically airdrops tokens to the sender whenever SOL is transferred to the owner's wallet.
- **Solana Blockchain**: Utilizes the Solana blockchain for fast and secure transactions.
- **Easy Integration**: Simple to set up and integrate with your Solana wallet.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- A Solana wallet with sufficient SOL for transaction fees
- Token 2022 created and deployed on the Solana blockchain

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/2enology/token2022-airdrop-bot.git
    cd token-2022-bot
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

## Configuration

1. Create a `.env` file in the root directory of the project and add the following variables:

    ```env
    PRIVATE_KEY=your_wallet_private_key
    SOL_VAULT_WALLET=your_owner_wallet_address
    SOL_TOKEN_ADDRESS=your_token_mint_address
    ```

2. Replace `your_wallet_private_key`, `your_owner_wallet_address`, and `your_token_mint_address` with your actual wallet's private key, the owner's wallet address, and the token mint address respectively.

## Usage

1. Start the bot:

    ```bash
    npm start
    ```

2. The bot will now listen for incoming SOL transfers to the owner's wallet and automatically airdrop the specified token to the sender.

## Example

Here is an example of how the bot works:

1. A user transfers 1 SOL to the owner's wallet.
2. The bot detects the transfer.
3. The bot automatically airdrops a predetermined amount of the token to the user's wallet.

## Contributing

We welcome contributions to enhance the functionality and features of the Token 2022 Bot. Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Solana](https://solana.com/) for providing the blockchain infrastructure.
- [Node.js](https://nodejs.org/) for the runtime environment.
- Community contributors for their valuable inputs and suggestions.

