import { processPendingDeliveries } from "../modules/deliveries/delivery.service";

const DELIVERY_WORKER_NAME = process.env.DELIVERY_WORKER_NAME || "delivery-worker";

const parsedDeliveryPollInterval = Number(process.env.DELIVERY_WORKER_POLL_INTERVAL_MS);

const DELIVERY_POLL_INTERVAL_MS =
  Number.isFinite(parsedDeliveryPollInterval) && parsedDeliveryPollInterval > 0
    ? parsedDeliveryPollInterval
    : 2000;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function deliveryWorkerLoop() {
  console.log(`[${DELIVERY_WORKER_NAME}] Started. Poll interval: ${DELIVERY_POLL_INTERVAL_MS}ms`);

  while (true) {
    try {
      await processPendingDeliveries();
    } catch (error) {
      console.error(`[${DELIVERY_WORKER_NAME}] Delivery worker error:`, error);
    } finally {
      await sleep(DELIVERY_POLL_INTERVAL_MS);
    }
  }
}

deliveryWorkerLoop();
