import { Router, type Request, type Response } from "express";
import { reportOutcome, getReputation } from "../db.js";

const router = Router();

router.post("/services/:id/report", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { success, response_ms } = req.body;

  if (typeof success !== "boolean" || typeof response_ms !== "number") {
    res.status(400).json({
      error: "Required fields: success (boolean), response_ms (number)",
    });
    return;
  }

  reportOutcome(id, success, response_ms);
  res.json({ message: "Outcome reported" });
});

router.get("/services/:id/reputation", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const rep = getReputation(id);

  if (!rep) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.json(rep);
});

export default router;
