import crypto from "crypto";

const secret = "d9ef7b14aa5e4890ad7dd5556aa16cd4ef7d07ebe01a4f9ba590949f65dbea2d";

const rawBody = JSON.stringify({
  orderId: "ORD-123",
  amount: 250,
  status: "created",
});

const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

console.log("Signature:", signature);
console.log("Body:", rawBody);
