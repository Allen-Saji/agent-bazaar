import { Router, type Request, type Response } from "express";
import { discoverServices, getAllServices } from "../db.js";
import type { DiscoverQuery, ServiceCategory } from "@agent-bazaar/common";

const router = Router();

router.get("/discover", (req: Request, res: Response) => {
  const query: DiscoverQuery = {
    category: req.query.category as ServiceCategory | undefined,
    max_price: req.query.max_price as string | undefined,
    healthy:
      req.query.healthy !== undefined
        ? req.query.healthy === "true"
        : undefined,
    tags: req.query.tags as string | undefined,
  };

  const services = discoverServices(query);
  res.json(services);
});

router.get("/catalog", (_req: Request, res: Response) => {
  const services = getAllServices();
  res.json(services);
});

export default router;
