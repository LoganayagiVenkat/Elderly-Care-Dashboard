import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  total = 0,
  limit = 10,
  onLimitChange,
  compact = false,
  showInfo = false,
  showPageSize = false,
  pageSizeOptions = [5, 10, 20, 50],
}) {
  if (totalPages <= 1 && total <= limit && !showPageSize) {
    // If only 1 page and no size selector needed, still render minimal or return null if empty
    if (total === 0) return null;
  }

  // Calculate visible page range (max 5 items)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = total > 0 ? Math.min(page * limit, total) : 0;

  return (
    <div className={`pagination-container ${compact ? 'compact' : ''}`}>
      {showInfo && total > 0 && (
        <div className="pagination-info">
          Showing <span className="font-semibold">{startItem}</span>–<span className="font-semibold">{endItem}</span> of{' '}
          <span className="font-semibold">{total}</span> records
        </div>
      )}

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn nav-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous Page"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              className={`pagination-btn page-num ${page === 1 ? 'active' : ''}`}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pages[0] > 2 && <span className="pagination-ellipsis">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`pagination-btn page-num ${page === p ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
            <button
              type="button"
              className={`pagination-btn page-num ${page === totalPages ? 'active' : ''}`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="pagination-btn nav-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next Page"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {showPageSize && onLimitChange && (
        <div className="pagination-size-select">
          <label htmlFor="pagination-limit-select" className="text-xs text-muted">Per page:</label>
          <select
            id="pagination-limit-select"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="pagination-select"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
