export type ContentBlock =
  | { _type: "imageBlock"; _key: string; url: string; orientation: "horizontal" | "vertical"; caption?: string }
  | { _type: "imagePair"; _key: string; leftUrl: string; rightUrl: string; caption?: string }
  | { _type: "videoBlock"; _key: string; url: string; caption?: string }
  | { _type: "gifBlock"; _key: string; url: string; caption?: string }
  | { _type: "textBlock"; _key: string; text: string };

export interface CreditItem {
  _key: string;
  role: string;
  name: string;
}

export interface RelatedProject {
  id: string;
  name: string;
  image: string;
  category: string;
}

export interface ProjectDetail {
  description: string;
  year: string;
  category: string;
  discipline?: string;
  client?: string;
  tags: string[];
  role: string[];
  content: ContentBlock[];
  credits: CreditItem[];
  relatedProjects: RelatedProject[];
  liveUrl?: string;
  externalUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  image: string;
  detail: ProjectDetail;
}

// Lightweight project — used in the carousel (no heavy content blocks).
export interface ProjectListItem {
  id: string;
  name: string;
  image: string;
  detail: {
    category?: string;
    discipline?: string;
  };
}
