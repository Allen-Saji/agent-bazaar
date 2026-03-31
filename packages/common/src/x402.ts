import { FACILITATOR_URL } from "./constants.js";

export interface X402PaywallConfig {
  route: string;
  method: string;
  price: string;
  network: string;
  payTo: string;
  description: string;
}

export function buildPaywallRoutes(
  configs: X402PaywallConfig[],
): Record<string, { accepts: Array<Record<string, string>>; description: string }> {
  const routes: Record<
    string,
    { accepts: Array<Record<string, string>>; description: string }
  > = {};

  for (const config of configs) {
    const key = `${config.method.toUpperCase()} ${config.route}`;
    routes[key] = {
      accepts: [
        {
          scheme: "exact",
          price: config.price,
          network: config.network,
          payTo: config.payTo,
        },
      ],
      description: config.description,
    };
  }

  return routes;
}

export { FACILITATOR_URL };
