const express = require("express");
const Binance = require("binance-api-node").default;
require("dotenv").config();

const app = express();
app.use(express.json());

// Binance API credentials
const { API_KEY, API_SECRET } = process.env;
const client = Binance({ apiKey: API_KEY, apiSecret: API_SECRET });

const MARKET_ORDER = "MARKET";
const TRAILING_STOP_MARKET_ORDER = "TRAILING_STOP_MARKET";

app.get("/", (req, res) => {
  res.send("Hello from Binance Futures Trading Webhook API");
});

app.post("/webhook", async (req, res) => {
  const { symbol, side, quantity } = req.body;
  const trimmedSymbol = symbol.slice(0, -2);

  try {
    console.log("Received webhook data:", req.body);

    // Handle position and order logic
    await handlePositionAndOrder(trimmedSymbol, side, quantity);

    res.status(200).json({ message: "Order processed successfully" });
  } catch (error) {
    console.error("Error processing webhook data:", error);
    res.status(400).json({ error: error.message });
  }
});

async function handlePositionAndOrder(symbol, side, quantity) {
  const positionInfo = await client.futuresPositionRisk({ symbol });
  const currentPosition = positionInfo.find(pos => pos.symbol === symbol);

  if (currentPosition && parseFloat(currentPosition.positionAmt) !== 0) {
    const oppositeSide = currentPosition.positionAmt > 0 ? "SELL" : "BUY";
    if ((side === "sell" && oppositeSide === "SELL") || (side === "buy" && oppositeSide === "BUY")) {
      await client.futuresOrder({
        symbol,
        side: oppositeSide,
        type: MARKET_ORDER,
        quantity: Math.abs(parseFloat(currentPosition.positionAmt)),
      });
      console.log("Closed existing position.");
    }
  }

  const marketOrder = await client.futuresOrder({
    symbol,
    side: side.toUpperCase(),
    type: MARKET_ORDER,
    quantity,
  });
  console.log("Placed new market order:", marketOrder);

  await placeTrailingStopOrder(symbol, side, quantity);
}

async function placeTrailingStopOrder(symbol, side, quantity) {
  // Cancel any existing trailing stop orders
  await cancelExistingTrailingStopOrders(symbol);

  // Place a new trailing stop order
  const newPositionInfo = await client.futuresPositionRisk({ symbol });
  const newPosition = newPositionInfo.find(pos => pos.symbol === symbol);

  if (newPosition) {
    const activationPrice = side === "buy"
      ? parseFloat(newPosition.markPrice) * 1.005
      : parseFloat(newPosition.markPrice) * 0.995;

    const newTrailingStopOrder = await client.futuresOrder({
      symbol,
      side: side.toUpperCase() === "BUY" ? "SELL" : "BUY",
      type: TRAILING_STOP_MARKET_ORDER,
      quantity,
      activationPrice: activationPrice.toFixed(2),
      callbackRate: 0.5,
    });
    console.log("Placed new trailing stop order:", newTrailingStopOrder);
  } else {
    console.log("Unable to retrieve new position information.");
  }
}

async function cancelExistingTrailingStopOrders(symbol) {
  const allOrders = await client.futuresAllOrders({ symbol });
  const trailingStopOrders = allOrders.filter(order => order.type === TRAILING_STOP_MARKET_ORDER && order.status === 'NEW');

  for (const order of trailingStopOrders) {
    await client.futuresCancelOrder({
      symbol: symbol,
      orderId: order.orderId,
    });
    console.log(`Canceled existing trailing stop order with ID: ${order.orderId}`);
  }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
