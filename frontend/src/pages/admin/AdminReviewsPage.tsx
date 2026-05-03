import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../../api/client";
import { AdminReview, renderPager } from "./shared";

const PAGE_SIZE = 8;

export function AdminReviewsPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewRatingFilter, setReviewRatingFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filteredReviews = useMemo(
    () => reviews.filter((r) => (reviewRatingFilter === "all" ? true : String(r.rating) === reviewRatingFilter)),
    [reviews, reviewRatingFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const pagedReviews = useMemo(() => filteredReviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredReviews, page]);

  useEffect(() => setPage(1), [reviewRatingFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function loadData() {
    setBusy(true);
    setError(null);
    try {
      const r = await apiJson<AdminReview[]>("/api/v1/admin/reviews?limit=200");
      setReviews(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function deleteReview(reviewId: string) {
    if (!confirm("Delete this review?")) return;
    setError(null);
    setOkMsg(null);
    try {
      await apiJson(`/api/v1/admin/reviews/${reviewId}`, { method: "DELETE" });
      setOkMsg("Review deleted");
      setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete review");
    }
  }

  return (
    <article className="card admin-card">
      <h2 className="h2">Reviews</h2>
      {busy && <p className="muted">Loading reviews…</p>}
      {error && <p className="error">{error}</p>}
      {okMsg && <p className="success">{okMsg}</p>}

      <select value={reviewRatingFilter} onChange={(e) => setReviewRatingFilter(e.target.value)}>
        <option value="all">All ratings</option>
        <option value="5">5 stars</option>
        <option value="4">4 stars</option>
        <option value="3">3 stars</option>
        <option value="2">2 stars</option>
        <option value="1">1 star</option>
      </select>

      <ul className="list-plain stack">
        {pagedReviews.map((r) => (
          <li key={r.reviewId} className="card flat">
            <div className="row spread">
              <strong>{r.rating}/5</strong>
              <button type="button" className="danger" onClick={() => void deleteReview(r.reviewId)}>
                Delete
              </button>
            </div>
            <p className="small muted">
              {r.customerPhone} · order {r.orderId.slice(0, 8)}
            </p>
            {r.comment && <p className="small">{r.comment}</p>}
          </li>
        ))}
      </ul>
      {renderPager(page, totalPages, setPage)}
    </article>
  );
}
