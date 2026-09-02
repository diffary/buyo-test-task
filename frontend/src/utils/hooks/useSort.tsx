import { useState } from "react";

export type SortOrder = "asc" | "desc";

export const useSort = <T extends string>(defaultKey: T, defaultOrder: SortOrder = "asc") => {
  const [sortBy, setSortBy] = useState<T>(defaultKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultOrder);

  const handleSort = (key: T) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  return { sortBy, sortOrder, handleSort };
};
