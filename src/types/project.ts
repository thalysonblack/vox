export interface ProjectDetail {
  description: string;
  year: string;
  category: string;
  client?: string;
  tags: string[];
  role: string[];
  gallery: string[];
  externalUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  image: string;
  detail: ProjectDetail;
}
