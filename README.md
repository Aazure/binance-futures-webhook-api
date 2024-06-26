# Binance Futures Trading Webhook API

This API is designed to receive webhook alerts for trading signals and execute corresponding orders on Binance Futures. It supports market orders and trailing stop orders based on the received signals.

## Features

- Receive trading signals via webhook alerts.
- Execute market orders on Binance Futures.
- Set trailing stop orders with customizable activation prices and callback rates.
- Automatically cancel existing trailing stop orders before placing new ones.

## Prerequisites

- [Bun](https://bun.sh) installed.
- A Binance account with Futures trading enabled.
- API key and secret for Binance Futures.

## Installation

1. Clone the repository and navigate to the project directory:

    ```bash
    git clone https://github.com/aazure/binance-futures-webhook-api.git
    cd binance-futures-webhook-api
    ```

2. Install the required dependencies using Bun:

    ```bash
    bun install
    ```

3. Create a `.env` file in the root directory and add your Binance API credentials:

    ```plaintext
    API_KEY=your_binance_api_key
    API_SECRET=your_binance_api_secret
    ```
## Usage

1. Start the server:

    ```bash
    bun run index.ts
    ```

2. Set up a webhook alert in TradingView with the following JSON payload format:

    ```json
    {
        "symbol": "{{ticker}}",
        "exchange": "{{exchange}}",
        "side": "{{strategy.order.action}}",
        "quantity": "0.01",
    }
    ```

    The endpoint URL should be `http://your_server_ip:8080/webhook`.

3. When the alert is triggered, the API will execute a market order on Binance Futures and set a trailing stop order based on the specified parameters.

## API Endpoint

- **POST /webhook**
  
  Receives a JSON payload with the following parameters:
  
  - `symbol`: The trading symbol (e.g., `BTCUSDT`).
  - `side`: The order side (`buy` or `sell`).
  - `quantity`: The order quantity.

  Example request body:

  ```json
  {
      "symbol": "BTCUSDT",
      "side": "buy",
      "quantity": "0.01"
  }

## Restrictions

Please note that the Binance API may not accept requests originating from IP addresses geolocated in certain prohibited countries. Before using this API, ensure that your IP address is not associated with a location subject to Binance's restrictions. For the most up-to-date list of prohibited countries, please refer to the [Binance List of Prohibited Countries](https://www.binance.com/en/legal/list-of-prohibited-countries).

