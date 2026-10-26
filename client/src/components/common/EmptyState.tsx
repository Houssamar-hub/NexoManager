import React from "react";
import { FolderOpen } from "lucide-react";

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ title, description, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200/80 my-4">
      <div className="p-4 bg-slate-100 rounded-full text-slate-500 mb-3">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200">
      <div className="text-xs text-slate-500">
        {totalItems !== undefined && itemsPerPage !== undefined ? (
          <>
            Affichage de{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            à{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            sur <span className="font-semibold text-slate-700">{totalItems}</span> résultats
          </>
        ) : (
          `Page ${currentPage} sur ${totalPages}`
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Précédent
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, idx, arr) => {
              const prev = arr[idx - 1];
              return (
                <React.Fragment key={page}>
                  {prev && page - prev > 1 && (
                    <span className="px-1 text-slate-400 text-xs">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      currentPage === page
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};
