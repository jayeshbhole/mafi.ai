import { Hono } from "hono";
import { handleRTCMessage } from "../huddle/rtcHandler.js";

const router = new Hono();

router.post("/webhook", async c => {
  try {
    const signature = c.req.header("x-huddle01-signature");
    const body = await c.req.text();

    if (!signature) {
      return c.json(
        {
          success: false,
          error: "Missing signature",
        },
        400,
      );
    }

    const success = await handleRTCMessage(signature, body);

    return c.json({
      success,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: "Failed to process webhook",
      },
      500,
    );
  }
});

export default router;
