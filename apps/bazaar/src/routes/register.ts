import { Router, type Request, type Response } from "express";
import { upsertServiceByUrl } from "../db.js";

const router = Router();

router.post("/register", (req: Request, res: Response) => {
  const {
    url,
    path,
    method,
    name,
    description,
    category,
    price_usd,
    network,
    asset,
    pay_to,
    input_schema,
    output_schema,
    tags,
  } = req.body;

  if (!url || !path || !name || !description || !category || !price_usd || !pay_to) {
    res.status(400).json({
      error: "Missing required fields: url, path, name, description, category, price_usd, pay_to",
    });
    return;
  }

  const id = upsertServiceByUrl(url, path, {
    url,
    path,
    method: method || "POST",
    name,
    description,
    category,
    price_usd,
    network: network || "stellar:testnet",
    asset: asset || "USDC",
    pay_to,
    input_schema,
    output_schema,
    tags: Array.isArray(tags) ? tags.join(",") : tags,
    source: "manual",
  });

  res.status(201).json({ id, message: "Service registered" });
});

export default router;
