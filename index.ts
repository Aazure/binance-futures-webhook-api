const express = require("express");
const Binance = require("binance-api-node").default;
require("dotenv").config();

const app = express();
app.use(express.json());

// Binance API credentials
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const client = Binance({
  apiKey: API_KEY,
  apiSecret: API_SECRET,
});

app.get("/", (req, res) => {
  res.send("hello");
});

app.post("/webhook", async (req, res) => {
  let { symbol, side, quantity } = req.body;
  symbol = symbol.slice(0, -2);
  //   const reversedAction = side === 'buy' ? 'sell' : 'buy';

  try {
    const data = req.body;
    console.log(data);
    const positionInfo = await client.futuresPositionRisk({ symbol: symbol });
    const currentPosition = positionInfo.find((pos) => pos.symbol === symbol);
    console.log("currentPosition: ", currentPosition);

    // Close existing position if it's opposite to the incoming side
    if (currentPosition && parseFloat(currentPosition.positionAmt) !== 0) {
      if (
        (side === "sell" && parseFloat(currentPosition.positionAmt) > 0) ||
        (side === "buy" && parseFloat(currentPosition.positionAmt) < 0)
      ) {
        // Close the position by placing an order with the opposite side
        await client.futuresOrder({
          symbol: symbol,
          side: currentPosition.positionAmt > 0 ? "SELL" : "BUY",
          type: "MARKET",
          quantity: Math.abs(parseFloat(currentPosition.positionAmt)),
        });
      }
    }

    // Open a new position based on the side
    const marketOrder = await client.futuresOrder({
      symbol: symbol,
      side: side.toUpperCase(),
      type: "MARKET",
      quantity: quantity,
    });
    console.log("marketOrder: ", marketOrder);
    const newPositionInfo = await client.futuresPositionRisk({
      symbol: symbol,
    });
    const newPosition = newPositionInfo.find((pos) => pos.symbol === symbol);
    console.log("newPosition markPrice: ", newPosition.markPrice);

    // Check if the newPosition object exists
    if (newPosition) {
      // Calculate the activation price for the trailing stop order based on newPosition.markPrice
      const activationPrice =
        side === "buy"
          ? parseFloat(newPosition.markPrice) * 1.005
          : parseFloat(newPosition.markPrice) * 0.995;

      // Place a trailing stop order with the calculated activation price
      const trailingStopOrder = await client.futuresOrder({
        symbol: symbol,
        side: side.toUpperCase() === "BUY" ? "SELL" : "BUY",
        type: "TRAILING_STOP_MARKET",
        quantity: quantity,
        activationPrice: activationPrice.toFixed(2),
        callbackRate: 0.5,
      });
      console.log("Trailing stop order:", trailingStopOrder);
    } else {
      console.log("New position information not available.");
    }

    res.status(200).json({ message: "Order processed successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
