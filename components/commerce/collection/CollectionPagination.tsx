import type { MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { collectionPageNumbers } from "@/lib/catalog/catalog-pagination";
import styles from "../collection-catalog.module.css";

export function CollectionPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const searchParams = useSearchParams();
  function pageHref(target: number) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(target));

    return `?${params}`;
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, target: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();

    window.history.pushState(null, "", pageHref(target));

    document.getElementById("collection-results")?.scrollIntoView({
      block: "start",
    });
  }

  return (
    <nav className={styles.pagination} aria-label="Collection pages">
      {page > 1 ? (
        <a href={pageHref(page - 1)} onClick={(event) => navigate(event, page - 1)}>
          Previous
        </a>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}

      {collectionPageNumbers(page, totalPages).map((number, index, numbers) => (
        <span key={number}>
          {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true"> ... </span>}

          <a
            href={pageHref(number)}
            aria-label={`Page ${number}`}
            aria-current={number === page ? "page" : undefined}
            onClick={(event) => navigate(event, number)}
          >
            {number}
          </a>
        </span>
      ))}

      {page < totalPages ? (
        <a href={pageHref(page + 1)} onClick={(event) => navigate(event, page + 1)}>
          Next
        </a>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  );
}
