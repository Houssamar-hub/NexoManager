import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 15,
  onPageChange,
}) => {
  if (totalItems === 0 || totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 text-xs text-slate-500 bg-slate-50">
        <span>Total : {totalItems} élément{totalItems > 1 ? "s" : ""}</span>
      </div>
    );
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm">
      <div className="text-xs text-slate-500">
        Affichage de <span className="font-semibold text-slate-700">{startItem}</span> à{" "}
        <span className="font-semibold text-slate-700">{endItem}</span> sur{" "}
        <span className="font-semibold text-slate-700">{totalItems}</span> résultats
      </div>

      <div className="inline-flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Page précédente"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((item, idx) =>
          typeof item === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(item)}
              className={`min-w-[32px] h-8 px-2 text-xs font-medium rounded-lg transition ${
                item === currentPage
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item}
            </button>
          ) : (
            <span key={idx} className="px-2 text-slate-400 text-xs">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Page suivante"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
