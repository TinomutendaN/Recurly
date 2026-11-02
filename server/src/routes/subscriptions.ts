import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import mongoose from "mongoose";
import { Subscription, FREQUENCIES, STATUSES } from "../models/Subscription.js";

const router = Router();

// Fields a client is allowed to set — userId and timestamps always come from the server
const EDITABLE_FIELDS = [
  "name", "price", "currency", "frequency", "category", "plan",
  "paymentMethod", "status", "iconKey", "color", "startDate", "renewalDate",
] as const;

function requireUser(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.locals.userId = userId;
  next();
}

function pickEditable(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

function validate(data: Record<string, unknown>, { partial }: { partial: boolean }): string | null {
  if (!partial || "name" in data) {
    if (typeof data.name !== "string" || !data.name.trim()) return "name is required";
  }
  if (!partial || "price" in data) {
    if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0) {
      return "price must be a non-negative number";
    }
  }
  if (!partial || "paymentMethod" in data) {
    if (typeof data.paymentMethod !== "string" || !data.paymentMethod.trim()) {
      return "paymentMethod is required";
    }
    // Only a label like "Visa ending in 4242" is stored — refuse anything resembling a full card number
    if (/\d{5,}/.test(data.paymentMethod.replace(/[\s-]/g, ""))) {
      return "paymentMethod must not contain a full card number";
    }
  }
  if ("frequency" in data && !FREQUENCIES.includes(data.frequency as never)) {
    return `frequency must be one of ${FREQUENCIES.join(", ")}`;
  }
  if ("status" in data && !STATUSES.includes(data.status as never)) {
    return `status must be one of ${STATUSES.join(", ")}`;
  }
  return null;
}

function nextRenewal(from: Date, frequency: string) {
  const date = new Date(from);
  if (frequency === "Yearly") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date;
}

router.use(requireUser);

// List the signed-in user's subscriptions, rolling past renewal dates forward
router.get("/", async (_req, res) => {
  const userId = res.locals.userId as string;
  const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });

  const now = new Date();
  await Promise.all(
    subscriptions
      .filter((sub) => sub.status === "active" && sub.renewalDate < now)
      .map((sub) => {
        let renewal = sub.renewalDate;
        while (renewal < now) renewal = nextRenewal(renewal, sub.frequency);
        sub.renewalDate = renewal;
        return sub.save();
      })
  );

  res.json(subscriptions);
});

router.post("/", async (req, res) => {
  const data = pickEditable(req.body ?? {});
  const error = validate(data, { partial: false });
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const startDate = data.startDate ? new Date(data.startDate as string) : new Date();
  const renewalDate = data.renewalDate
    ? new Date(data.renewalDate as string)
    : nextRenewal(startDate, (data.frequency as string) ?? "Monthly");
  const subscription = await Subscription.create({
    ...data,
    startDate,
    renewalDate,
    userId: res.locals.userId,
  });

  res.status(201).json(subscription);
});

router.patch("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const data = pickEditable(req.body ?? {});
  const error = validate(data, { partial: true });
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const subscription = await Subscription.findOneAndUpdate(
    { _id: req.params.id, userId: res.locals.userId },
    data,
    { new: true, runValidators: true }
  );
  if (!subscription) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json(subscription);
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const result = await Subscription.deleteOne({ _id: req.params.id, userId: res.locals.userId });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.status(204).end();
});

export default router;
