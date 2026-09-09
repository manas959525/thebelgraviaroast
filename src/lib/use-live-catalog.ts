import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { products, type Product } from "@/data/menu";

/**
 * Wraps the static catalog with live availability flags from the database.
 * Admin "sold out" toggles apply here instantly (no redeploy needed).
 * While the DB loads (or if it's unreachable), the static catalog is used as-is.
 */
export function useProductsWithFlags() {
  const flags = useQuery(api.cafe.listProductFlags);

  const flagMap = useMemo(() => {
    const map = new Map<string, { available: boolean; note?: string }>();
    (flags ?? []).forEach((f) => map.set(f.productId, { available: f.available, note: f.note }));
    return map;
  }, [flags]);

  const applyFlags = (p: Product): Product => {
    const flag = flagMap.get(p.id);
    return flag ? { ...p, available: flag.available } : p;
  };

  const allProducts = useMemo(() => (flags === undefined ? products : products.map(applyFlags)), [flags]);

  const isAvailable = (productId: string) => {
    const flag = flagMap.get(productId);
    if (!flag) {
      const staticProduct = products.find((p) => p.id === productId);
      return staticProduct ? staticProduct.available : false;
    }
    return flag.available;
  };

  return { allProducts, isAvailable, flagsLoaded: flags !== undefined };
}
