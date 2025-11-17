/**
 * usePagination Hook
 * 
 * React hook for client-side pagination with smart chunk loading.
 * Much simpler than virtual scrolling and better UX for most cases.
 * 
 * Features:
 * - Automatic page calculation
 * - Current page state management
 * - Smart item-per-page defaults
 * - Total pages calculation
 * - Go to page functionality
 * 
 * Usage:
 * const { paginatedItems, currentPage, totalPages, goToPage, nextPage, prevPage } = 
 *   usePagination(items, 50);
 * 
 * Created: 2025-11-06
 */

import { useMemo, useState, useCallback } from 'react';

interface UsePaginationReturn<T> {
  paginatedItems: T[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setItemsPerPage: (count: number) => void;
}

export function usePagination<T>(
  items: T[],
  initialItemsPerPage: number = 50
): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
    [items.length, itemsPerPage]
  );

  // Calculate start and end indices
  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + itemsPerPage, items.length),
    [startIndex, itemsPerPage, items.length]
  );

  // Get paginated items
  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  // Navigation functions
  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  // Check if navigation is possible
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset to first page when items change significantly
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Handle items per page change
  const handleSetItemsPerPage = useCallback((count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page
  }, []);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNextPage,
    hasPrevPage,
    setItemsPerPage: handleSetItemsPerPage,
  };
}
