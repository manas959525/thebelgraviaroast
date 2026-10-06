import { useState } from "react";
import { Archive, Minus, Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const inputClass =
  "w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold";

const emptyForm = { name: "", unit: "pcs", quantity: "", lowStockAt: "" };

export function InventoryView() {
  const inventory = useQuery(api.cafe.listInventory);
  const saveItem = useMutation(api.cafe.saveInventoryItem);
  const adjustStock = useMutation(api.cafe.adjustInventoryStock);
  const deleteItem = useMutation(api.cafe.deleteInventoryItem);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<Id<"inventory"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = inventory ?? [];
  const lowCount = items.filter((i) => i.quantity <= i.lowStockAt).length;

  const startEdit = (item: {
    _id: Id<"inventory">;
    name: string;
    unit: string;
    quantity: number;
    lowStockAt: number;
  }) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: String(item.quantity),
      lowStockAt: String(item.lowStockAt),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Give the item a name");
      return;
    }
    setSaving(true);
    try {
      await saveItem({
        id: editingId ?? undefined,
        name: form.name.trim(),
        unit: form.unit.trim() || "pcs",
        quantity: Number(form.quantity) || 0,
        lowStockAt: Number(form.lowStockAt) || 0,
      });
      toast.success(editingId ? "Inventory item updated" : "Inventory item added");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save item");
    } finally {
      setSaving(false);
    }
  };

  const step = (id: Id<"inventory">, delta: number) => {
    void adjustStock({ id, delta })
      .then(() => {})
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Could not update stock"),
      );
  };

  const remove = (id: Id<"inventory">, name: string) => {
    void deleteItem({ id })
      .then(() => toast.success(`${name} removed from inventory`))
      .catch((err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Could not delete item"),
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Track ingredient and supply stock — items at or below their threshold are
            flagged as low stock.
          </p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="flex items-center gap-2 bg-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gold/90 transition-all shrink-0"
        >
          <PackagePlus className="h-4 w-4" />
          {showForm ? "Close" : "Add Item"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-elevated rounded-2xl border-0 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div className="lg:col-span-2">
            <label className="text-xs font-medium block mb-1">Item name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Arabica coffee beans"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Unit</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className={inputClass}
            >
              {["pcs", "kg", "g", "litres", "ml", "packs", "boxes"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Current stock</label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Low-stock at</label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.lowStockAt}
              onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })}
              placeholder="0"
              className={inputClass}
              required
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-all disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-elevated rounded-2xl border-0 p-5">
          <div className="text-xs text-muted-foreground mb-1">Items Tracked</div>
          <div className="text-2xl font-bold text-foreground">{items.length}</div>
        </div>
        <div className="glass-elevated rounded-2xl border-0 p-5">
          <div className="text-xs text-muted-foreground mb-1">Low Stock</div>
          <div className={`text-2xl font-bold ${lowCount > 0 ? "text-red-500" : "text-sage"}`}>
            {lowCount}
          </div>
        </div>
        <div className="glass-elevated rounded-2xl border-0 p-5">
          <div className="text-xs text-muted-foreground mb-1">Healthy Stock</div>
          <div className="text-2xl font-bold text-foreground">{items.length - lowCount}</div>
        </div>
      </div>

      {inventory === undefined ? (
        <div className="glass-elevated rounded-2xl border-0 p-10 text-center">
          <div className="h-5 w-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-elevated rounded-2xl border-0 p-10 text-center">
          <Archive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No inventory items yet — add your first ingredient or supply above.
          </p>
        </div>
      ) : (
        <div className="glass-elevated rounded-2xl border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Item
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Current Stock
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Low-Stock At
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                    Updated
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const low = item.quantity <= item.lowStockAt;
                  return (
                    <tr key={item._id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-5 py-3">
                        <span className="font-bold">{item.quantity}</span>{" "}
                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {item.lowStockAt} {item.unit}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            low ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {low ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(item.updatedAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => step(item._id, -1)}
                            aria-label={`Decrease ${item.name} stock`}
                            className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => step(item._id, 1)}
                            aria-label={`Increase ${item.name} stock`}
                            className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-muted"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            aria-label={`Edit ${item.name}`}
                            className="h-7 w-7 rounded-lg border flex items-center justify-center text-gold hover:bg-gold/10"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => remove(item._id, item.name)}
                            aria-label={`Delete ${item.name}`}
                            className="h-7 w-7 rounded-lg border flex items-center justify-center text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
