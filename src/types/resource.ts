export type ResourceType = "quick_link" | "guide" | "tool" | "template" | "support";

export type ResourceStatus = "active" | "draft";

export interface ResourceItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  url: string;
  category: string;
  type: ResourceType;
  featured: boolean;
  tags: string[];
  icon?: string;
  order: number;
  status: ResourceStatus;
}
