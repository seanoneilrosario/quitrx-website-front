"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collectionAvailableFiltersQuery,
  collectionPageQuery,
  type CollectionPageResponse,
} from "@/lib/catalog/catalog-queries";
import type { CollectionFilterState } from "./useCollectionFilters";
import { sortProducts } from "./sort-products";
export function useCollectionData(
  collectionSlug: string,
  initialPage: CollectionPageResponse | undefined,
  { page, pageFilters, hasProductFilters, sort }: CollectionFilterState,
) {
  /**
   * Products are filtered and paginated
   * by the backend.
   */
  const { data, error, isPending, isFetching, refetch } = useQuery({
    ...collectionPageQuery(collectionSlug, page, pageFilters),

    /**
     * Only use the server-provided initial
     * snapshot when there are no URL filters.
     *
     * Otherwise the initial snapshot would be
     * the unfiltered collection data.
     */
    initialData:
      !hasProductFilters && initialPage?.pagination.page === page ? initialPage : undefined,
  });

  /**
   * Available filters are independent from the
   * current product page.
   *
   * The backend determines which filters actually
   * exist for this collection.
   */
  const { data: availableFiltersData } = useQuery({
    ...collectionAvailableFiltersQuery(collectionSlug, pageFilters),
  });

  const products = useMemo(() => data?.products ?? [], [data]);

  const collection = data?.collection ?? {
    name: collectionSlug.replaceAll("-", " "),
  };

  const productsLoading = isPending;

  const productsError = error?.message ?? "";

  const availableFilters = availableFiltersData?.data?.filters ?? [];

  /**
   * Availability is currently not part of
   * CollectionPageFilters/backend product
   * filtering, so don't expose it as a
   * selectable frontend filter yet.
   *
   * The backend available-filters endpoint can
   * still return it, but we won't display a
   * filter that cannot affect the product query.
   */
  const storefrontFilters = availableFilters.filter((filter) => filter.type !== "AVAILABILITY");

  const totalPages = Math.max(
    1,
    data?.pagination.totalPages ?? initialPage?.pagination.totalPages ?? 1,
  );

  const visibleProducts = useMemo(() => sortProducts(products, sort), [products, sort]);
  return {
    collection,
    products,
    visibleProducts,
    storefrontFilters,
    totalPages,
    totalProducts: data?.pagination.total ?? products.length,
    productsLoading,
    productsError,
    isFetching,
    refetch,
  };
}
