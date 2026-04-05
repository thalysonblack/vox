"use client";

import { useMemo, useState } from "react";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourcesToolbar from "@/components/resources/ResourcesToolbar";
import type { ResourceItem, ResourceType } from "@/types/resource";

interface ResourcesGridProps {
  resources: ResourceItem[];
}

export default function ResourcesGrid({ resources }: ResourcesGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const categories = useMemo(
    () =>
      Array.from(new Set(resources.map((resource) => resource.category)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [resources],
  );

  const types = useMemo(
    () => Array.from(new Set(resources.map((resource) => resource.type))).sort() as ResourceType[],
    [resources],
  );

  const filteredResources = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesCategory =
        selectedCategory === "all" || resource.category === selectedCategory;
      const matchesType = selectedType === "all" || resource.type === selectedType;

      if (!searchValue) {
        return matchesCategory && matchesType;
      }

      const blob = [
        resource.title,
        resource.description ?? "",
        resource.category,
        resource.type,
        ...resource.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && matchesType && blob.includes(searchValue);
    });
  }, [resources, search, selectedCategory, selectedType]);

  const hasFilters = search.trim() || selectedCategory !== "all" || selectedType !== "all";

  return (
    <section className="space-y-6">
      <ResourcesToolbar
        search={search}
        selectedCategory={selectedCategory}
        selectedType={selectedType}
        categories={categories}
        types={types}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategory}
        onTypeChange={setSelectedType}
      />

      {filteredResources.length === 0 ? (
        <div className="rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-8 text-center">
          <p className="text-[16px] font-semibold tracking-[-0.48px] text-black">
            Nenhum recurso encontrado.
          </p>
          <p className="mt-2 text-[14px] text-black/60">
            {hasFilters
              ? "Ajuste sua busca ou filtros para encontrar o que precisa."
              : "Adicione recursos no Sanity Studio para começar."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </section>
  );
}
