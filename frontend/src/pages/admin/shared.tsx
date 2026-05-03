import { ReactNode } from "react";

export type AdminOrder = {
  orderId: string;
  userId: string;
  customerPhone: string;
  status: string;
  total: number;
  paymentStatus: string;
  createdAt: string;
  deliveryAgentId: string | null;
  deliveredAt?: string | null;
  deliveryAddressSnapshot?: string | null;
  paidAt?: string | null;
  customerNote: string | null;
};

export type AdminOrderLine = {
  lineId: string;
  menuItemId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type AdminOrderDetail = {
  orderId: string;
  userId: string;
  customerPhone: string;
  status: string;
  lines: AdminOrderLine[];
  total: number;
  createdAt: string;
  deliveryAgentId: string | null;
  deliveredAt: string | null;
  deliveryAddressSnapshot: string | null;
  paymentStatus: string;
  paidAt: string | null;
  customerNote: string | null;
};

export type AdminReview = {
  reviewId: string;
  orderId: string;
  customerPhone: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type DeliveryAgent = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
};

export type AdminCategory = {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
};

export type AdminItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  discountedPrice: number | null;
  imageUrl: string | null;
  veg: boolean;
  available: boolean;
  preparationTime: number;
  calories: number | null;
  tags: string[] | null;
  displayOrder: number;
};

export function renderPager(page: number, total: number, setPage: (page: number) => void): ReactNode {
  if (total <= 1) return null;
  return (
    <div className="pager">
      <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Prev
      </button>
      <span className="small muted">
        Page {page} / {total}
      </span>
      <button type="button" disabled={page >= total} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
