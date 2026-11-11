"use client";
import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collectionAvailableFiltersQuery,
  collectionPageQuery,
  type CollectionPageResponse,
} from "@/lib/catalog/catalog-queries";
import type { CollectionFilterState } from "./useCollectionFilters";
import { useReloadCollection } from "./useReloadCollection";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useCollectionData(
  collectionSlug: string,
  initialPage: CollectionPageResponse | undefined,
  { page, pageFilters, hasProductFilters, sort }: CollectionFilterState,
) {
  // Browser query caches can contain data the server never rendered. Use the
  // server snapshot through hydration, then allow cached/live results to render.
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const initialData =
    !hasProductFilters &&
    // (collectionSlug === "all-products" || sort === "MANUAL") &&
    // initialPage?.pagination.page === page
    //   ? initialPage
    //   : undefined;
    sort === "MANUAL" &&
    initialPage?.pagination.page === page
      ? initialPage
      : undefined;
  /**
   * Products are filtered and paginated
   * by the backend.
   */
  const {
    data: queryData,
    error,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    ...collectionPageQuery(collectionSlug, page, pageFilters),

    /**
     * Only use the server-provided initial
     * snapshot when there are no URL filters.
     *
     * Otherwise the initial snapshot would be
     * the unfiltered collection data.
     */
    initialData,
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

  useReloadCollection(hydrated, collectionSlug, page, pageFilters);

  const data = hydrated ? queryData : initialData;
  const products = useMemo(() => data?.products ?? [], [data]);

  const collection = initialPage?.collection ??
    data?.collection ?? {
      name: collectionSlug.replaceAll("-", " "),
    };

  const productsLoading = hydrated ? isPending : !initialData;

  const productsError = hydrated ? (error?.message ?? "") : "";

  const availableFilters = hydrated ? (availableFiltersData?.data?.filters ?? []) : [];

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

  const visibleProducts = products;
  return {
    collection,
    products,
    visibleProducts,
    storefrontFilters,
    totalPages,
    totalProducts: data?.pagination.total ?? products.length,
    productsLoading,
    productsError,
    isFetching: hydrated ? isFetching : false,
    refetch,
  };
}
