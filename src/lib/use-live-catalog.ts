import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { products, type Product } from "@/data/menu";

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

    const flagMap = new Map<string, boolean>();
    flags.forEach((f) => flagMap.set(f.productId, f.available));

    const overrideMap = new Map<string, (typeof overrides)[number]>();
    overrides.forEach((o) => overrideMap.set(o.productId, o));

    const overridden: Product[] = products
      .filter((p) => !overrideMap.get(p.id)?.hidden)
      .map((p) => {
        const o = overrideMap.get(p.id);
        const priceEdited = typeof o?.price === "number" && o.price > 0;
        const merged: Product = {
          ...p,
          name: o?.name?.trim() || p.name,
          description: o?.description?.trim() || p.description,
          price: priceEdited ? (o!.price as number) : p.price,
          image: o?.image?.trim() || p.image,
          isVeg: o?.isVeg ?? p.isVeg,
          available: flagMap.get(p.id) ?? p.available,
        };
        // An admin price edit replaces any static sale price entirely.
        if (priceEdited) delete merged.discountPrice;
        return merged;
      });

    const custom: Product[] = customRows
      .filter((c) => !overrideMap.get(c.productId)?.hidden)
      .map((c) => ({
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
        available: flagMap.get(c.productId) ?? c.available,
        tags: c.tags,
      }));

    return [...overridden, ...custom];
  }, [flags, overrides, customRows]);

  const isAvailable = (productId: string) =>
    allProducts.find((p) => p.id === productId)?.available ?? false;

  return { allProducts, isAvailable, flagsLoaded: flags !== undefined };
}
