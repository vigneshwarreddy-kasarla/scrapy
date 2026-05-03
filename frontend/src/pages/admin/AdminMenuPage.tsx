import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client";
import { formatMoney } from "../../utils/money";
import { AdminCategory, AdminItem, renderPager } from "./shared";

const PAGE_SIZE = 10;

export function AdminMenuPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [items, setItems] = useState<AdminItem[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", displayOrder: "0", imageUrl: "", active: true });
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    discountedPrice: "",
    imageUrl: "",
    veg: true,
    available: true,
    displayOrder: "0",
  });
  const [page, setPage] = useState(1);

  const activeCategory = useMemo(() => categories.find((c) => c.id === categoryId) ?? null, [categories, categoryId]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);

  useEffect(() => setPage(1), [categoryId]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function loadCategories() {
    const data = await apiJson<AdminCategory[]>("/api/v1/admin/menu/categories");
    setCategories(data);
    if (!categoryId && data.length > 0) setCategoryId(data[0].id);
    if (data.length === 0) setCategoryId("");
  }

  async function loadItems(nextCategoryId: string) {
    if (!nextCategoryId) {
      setItems([]);
      return;
    }
    const data = await apiJson<AdminItem[]>(`/api/v1/admin/menu/categories/${nextCategoryId}/items`);
    setItems(data);
  }

  async function loadAll() {
    setBusy(true);
    setError(null);
    try {
      const categoryData = await apiJson<AdminCategory[]>("/api/v1/admin/menu/categories");
      setCategories(categoryData);
      const nextCategoryId = categoryId || categoryData[0]?.id || "";
      setCategoryId(nextCategoryId);
      if (nextCategoryId) {
        const itemData = await apiJson<AdminItem[]>(`/api/v1/admin/menu/categories/${nextCategoryId}/items`);
        setItems(itemData);
      } else {
        setItems([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load menu admin data");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    void loadItems(categoryId).catch((e) => setError(e instanceof Error ? e.message : "Failed to load items"));
  }, [categoryId]);

  async function createCategory(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    setOkMsg(null);
    try {
      await apiJson("/api/v1/admin/menu/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCategory.name.trim(),
          displayOrder: Number(newCategory.displayOrder) || 0,
          imageUrl: newCategory.imageUrl.trim() || null,
          active: newCategory.active,
        }),
      });
      setOkMsg("Category created");
      setNewCategory({ name: "", displayOrder: "0", imageUrl: "", active: true });
      await loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete category and all items in it?")) return;
    setError(null);
    setOkMsg(null);
    try {
      await apiJson(`/api/v1/admin/menu/categories/${id}`, { method: "DELETE" });
      setOkMsg("Category deleted");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category");
    }
  }

  async function createMenuItem(ev: FormEvent) {
    ev.preventDefault();
    if (!categoryId) {
      setError("Select a category first");
      return;
    }
    setError(null);
    setOkMsg(null);
    try {
      await apiJson("/api/v1/admin/menu/items", {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          name: newItem.name.trim(),
          description: null,
          price: Number(newItem.price),
          discountedPrice: newItem.discountedPrice.trim() ? Number(newItem.discountedPrice) : null,
          imageUrl: newItem.imageUrl.trim() || null,
          veg: newItem.veg,
          available: newItem.available,
          preparationTime: 15,
          calories: null,
          tags: [],
          displayOrder: Number(newItem.displayOrder) || 0,
        }),
      });
      setOkMsg("Menu item created");
      setNewItem({
        name: "",
        price: "",
        discountedPrice: "",
        imageUrl: "",
        veg: true,
        available: true,
        displayOrder: "0",
      });
      await loadItems(categoryId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create menu item");
    }
  }

  async function deleteMenuItem(id: string) {
    if (!confirm("Delete this menu item?")) return;
    setError(null);
    setOkMsg(null);
    try {
      await apiJson(`/api/v1/admin/menu/items/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.id !== id));
      setOkMsg("Menu item deleted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete menu item");
    }
  }

  async function toggleItemAvailability(itemId: string, next: boolean) {
    setError(null);
    setOkMsg(null);
    try {
      await apiJson(`/api/v1/admin/menu/items/${itemId}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ available: next }),
      });
      setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, available: next } : it)));
      setOkMsg("Item availability updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update item");
    }
  }

  return (
    <article className="card admin-card">
      <h2 className="h2">Menu Management</h2>
      {busy && <p className="muted">Loading menu data…</p>}
      {error && <p className="error">{error}</p>}
      {okMsg && <p className="success">{okMsg}</p>}

      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} {c.active ? "" : "(inactive)"}
          </option>
        ))}
      </select>
      {activeCategory && <p className="small muted">Category order: {activeCategory.displayOrder}</p>}

      <form className="stack" onSubmit={(e) => void createCategory(e)}>
        <input
          placeholder="New category name"
          value={newCategory.name}
          onChange={(e) => setNewCategory((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <div className="row gap admin-actions-row">
          <input
            placeholder="Display order"
            value={newCategory.displayOrder}
            onChange={(e) => setNewCategory((v) => ({ ...v, displayOrder: e.target.value.replace(/[^\d-]/g, "") }))}
          />
          <input
            placeholder="Image URL (optional)"
            value={newCategory.imageUrl}
            onChange={(e) => setNewCategory((v) => ({ ...v, imageUrl: e.target.value }))}
          />
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={newCategory.active}
            onChange={(e) => setNewCategory((v) => ({ ...v, active: e.target.checked }))}
          />
          Active category
        </label>
        <button type="submit">Create category</button>
      </form>

      {activeCategory && (
        <button type="button" className="danger" onClick={() => void deleteCategory(activeCategory.id)}>
          Delete selected category
        </button>
      )}

      <form className="stack" onSubmit={(e) => void createMenuItem(e)}>
        <input
          placeholder="Item name"
          value={newItem.name}
          onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
          required
        />
        <div className="row gap admin-actions-row">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem((v) => ({ ...v, price: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Discounted price"
            value={newItem.discountedPrice}
            onChange={(e) => setNewItem((v) => ({ ...v, discountedPrice: e.target.value }))}
          />
        </div>
        <input
          placeholder="Image URL (optional)"
          value={newItem.imageUrl}
          onChange={(e) => setNewItem((v) => ({ ...v, imageUrl: e.target.value }))}
        />
        <div className="row gap">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={newItem.veg}
              onChange={(e) => setNewItem((v) => ({ ...v, veg: e.target.checked }))}
            />
            Veg
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={newItem.available}
              onChange={(e) => setNewItem((v) => ({ ...v, available: e.target.checked }))}
            />
            Available
          </label>
        </div>
        <input
          type="number"
          min="0"
          placeholder="Display order"
          value={newItem.displayOrder}
          onChange={(e) => setNewItem((v) => ({ ...v, displayOrder: e.target.value }))}
        />
        <button type="submit">Create item in selected category</button>
      </form>

      <ul className="list-plain stack">
        {pagedItems.map((i) => (
          <li key={i.id} className="card flat admin-item-row">
            <div>
              <strong>{i.name}</strong>
              <p className="small muted">{formatMoney(i.price)}</p>
            </div>
            <div className="admin-actions-row">
              <button type="button" onClick={() => void toggleItemAvailability(i.id, !i.available)}>
                {i.available ? "Disable" : "Enable"}
              </button>
              <button type="button" className="danger" onClick={() => void deleteMenuItem(i.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {renderPager(page, totalPages, setPage)}
    </article>
  );
}
