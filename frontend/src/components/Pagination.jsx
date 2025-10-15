import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ currentPage, totalPages, onPageChange, totalItems }) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[color:var(--border-default)]">
      <div className="text-sm text-[color:var(--fg-secondary)]">
        Showing page {currentPage} of {totalPages} ({totalItems} total items)
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="gap-1"
          data-testid="pagination-previous"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        
        {/* Page numbers */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={currentPage === pageNum ? "bg-emerald-500 text-black hover:bg-emerald-400" : ""}
                data-testid={`pagination-page-${pageNum}`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="gap-1"
          data-testid="pagination-next"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
