"use client";

import type { ResourceType } from "@/types/resource";

interface ResourcesToolbarProps {
  search: string;
  selectedCategory: string;
  selectedType: string;
  categories: string[];
  types: ResourceType[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

export default function ResourcesToolbar({
  search,
  selectedCategory,
  selectedType,
  categories,
  types,
  onSearchChange,
  onCategoryChange,
  onTypeChange,
}: ResourcesToolbarProps) {
  return (
    <div className="grid gap-3 border-b border-black/10 pb-5 md:grid-cols-[1.5fr_1fr_1fr]">
      <label className="flex h-[44px] items-center rounded-[6px] border border-black/15 bg-white px-3">
        <span className="sr-only">Buscar recursos</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nome, descrição ou tag"
          className="w-full bg-transparent text-[14px] font-medium tracking-[-0.2px] text-black outline-none placeholder:text-black/40"
        />
      </label>

      <label className="flex h-[44px] items-center rounded-[6px] border border-black/15 bg-white px-3">
        <span className="sr-only">Filtrar por categoria</span>
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full cursor-pointer bg-transparent text-[14px] font-medium tracking-[-0.2px] text-black outline-none"
        >
          <option value="all">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="flex h-[44px] items-center rounded-[6px] border border-black/15 bg-white px-3">
        <span className="sr-only">Filtrar por tipo</span>
        <select
          value={selectedType}
          onChange={(event) => onTypeChange(event.target.value)}
          className="w-full cursor-pointer bg-transparent text-[14px] font-medium tracking-[-0.2px] text-black outline-none"
        >
          <option value="all">Todos os tipos</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
