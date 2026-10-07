import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { products, type AvailabilityStatus, type Product } from "@/data/menu";

/**
 * Wraps the static catalog with live database state:
 * - availability flags (admin "sold out" toggles),
 * - admin edits to static items (name / description / price / image / veg,
 *   or a soft-remove via `hidden`),
 * - admin-added custom items.
 *
 * While the DB loads (or if it's unreachable), the static catalog is used
 * as-is so the storefront never flashes empty. The server applies the exact
 * same merge when pricing orders, so client and server totals always agree.
 */
export function useProductsWithFlags() {
  const flags = useQuery(api.cafe.listProductFlags);
  const overrides = useQuery(api.cafe.listProductOverrides);
  const customRows = useQuery(api.cafe.listCustomProducts);

  const allProducts = useMemo<Product[]>(() => {
    // Loading or unreachable — keep the pre-existing static behaviour.
    if (flags === undefined || overrides === undefined || customRows === undefined) {
      return products;
    }

    const flagMap = new Map<string, { available: boolean; status?: AvailabilityStatus }>();
    flags.forEach((f) => flagMap.set(f.productId, { available: f.available, status: f.status }));

    // Legacy boolean flags fall back to the richer 4-state status when set.
    const applyFlag = (id: string, available: boolean): { available: boolean; availability?: AvailabilityStatus } => {
      const f = flagMap.get(id);
      if (!f) return { available };
      const status = f.status ?? (f.available ? "available" : "sold_out");
      return {
        available: status === "available" || status === "limited",
        availability: status,
      };
    };

    const overrideMap = new Map<string, (typeof overrides)[number]>();
    overrides.forEach((o) => overrideMap.set(o.productId, o));

    const overridden: Product[] = products
      .filter((p) => !overrideMap.get(p.id)?.hidden)
      .map((p) => {
        const o = overrideMap.get(p.id);
        const priceEdited = typeof o?.price === "number" && o.price > 0;
        const flag = applyFlag(p.id, p.available);
        const merged: Product = {
          ...p,
          name: o?.name?.trim() || p.name,
          description: o?.description?.trim() || p.description,
          price: priceEdited ? (o!.price as number) : p.price,
          image: o?.image?.trim() || p.image,
          isVeg: o?.isVeg ?? p.isVeg,
          available: flag.available,
          availability: flag.availability,
        };
        // An admin price edit replaces any static sale price entirely.
        if (priceEdited) delete merged.discountPrice;
        return merged;
      });

    const custom: Product[] = customRows
      .filter((c) => !overrideMap.get(c.productId)?.hidden)
      .map((c) => {
        const flag = applyFlag(c.productId, c.available);
        return {
          id: c.productId,
          slug: c.slug,
          name: c.name,
          description: c.description,
          price: c.price,
          image: c.image,
          category: c.category,
          isVeg: c.isVeg,
          rating: c.rating,
          prepTime: c.prepTime,
          calories: c.calories,
          available: flag.available,
          availability: flag.availability,
          tags: c.tags,
        };
      });

    return [...overridden, ...custom];
  }, [flags, overrides, customRows]);

  const isAvailable = (productId: string) =>
    allProducts.find((p) => p.id === productId)?.available ?? false;

  return { allProducts, isAvailable, flagsLoaded: flags !== undefined };
}
