import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { Subscription } from "../models/Subscription.js";

const router = Router();

// Permanently deletes the signed-in user's data and their Clerk account
router.delete("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  // Remove their data first, so a failure here leaves the account intact to retry
  const { deletedCount } = await Subscription.deleteMany({ userId });
  await clerkClient.users.deleteUser(userId);

  console.log(`Deleted account ${userId} and ${deletedCount} subscription(s)`);
  res.status(204).end();
});

export default router;
