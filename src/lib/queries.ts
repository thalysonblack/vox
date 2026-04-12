// Light query for the carousel — only the fields needed to render cards.
export const projectsListQuery = `*[_type == "project"] | order(order asc) {
  "id": slug.current,
  name,
  "image": image.asset->url,
  "detail": {
    "category": category,
    "discipline": discipline
  }
}`;

// Full query for a single project — fetched lazily when panel opens.
export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug][0] {
  "id": slug.current,
  name,
  "image": image.asset->url,
  "detail": {
    "description": description,
    "year": year,
    "category": category,
    "discipline": discipline,
    "client": client,
    "tags": tags,
    "role": role,
    "content": content[] {
      _type,
      _key,
      _type == "imageBlock" => {
        "url": image.asset->url,
        orientation,
        caption
      },
      _type == "imagePair" => {
        "leftUrl": imageLeft.asset->url,
        "rightUrl": imageRight.asset->url,
        caption
      },
      _type == "videoBlock" => {
        "url": video.asset->url,
        caption
      },
      _type == "gifBlock" => {
        "url": gif.asset->url,
        caption
      },
      _type == "textBlock" => {
        text
      }
    },
    "credits": credits[] { _key, role, name },
    "relatedProjects": relatedProjects[]->{ "id": slug.current, name, "image": image.asset->url, "category": category },
    "liveUrl": liveUrl,
    "externalUrl": externalUrl
  }
}`;

// Legacy — kept for backward compatibility / routes that still fetch everything.
export const projectsQuery = `*[_type == "project"] | order(order asc) {
  "id": slug.current,
  name,
  "image": image.asset->url,
  "detail": {
    "description": description,
    "year": year,
    "category": category,
    "discipline": discipline,
    "client": client,
    "tags": tags,
    "role": role,
    "content": content[] {
      _type,
      _key,
      _type == "imageBlock" => {
        "url": image.asset->url,
        orientation,
        caption
      },
      _type == "imagePair" => {
        "leftUrl": imageLeft.asset->url,
        "rightUrl": imageRight.asset->url,
        caption
      },
      _type == "videoBlock" => {
        "url": video.asset->url,
        caption
      },
      _type == "gifBlock" => {
        "url": gif.asset->url,
        caption
      },
      _type == "textBlock" => {
        text
      }
    },
    "credits": credits[] { _key, role, name },
    "relatedProjects": relatedProjects[]->{ "id": slug.current, name, "image": image.asset->url, "category": category },
    "liveUrl": liveUrl,
    "externalUrl": externalUrl
  }
}`;

// Site settings (singleton document). Returns null if not yet created in Studio.
export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  scrollFriction,
  scrollSmoothLag,
  scrollWheelImpulse,
  scrollFlingMultiplier,
  scrollSnapDelay,
  scrollSnapDuration
}`;

export const resourcesQuery = `*[_type == "resourceItem" && status == "active"] | order(order asc) {
  "id": _id,
  title,
  "slug": slug.current,
  description,
  url,
  category,
  type,
  featured,
  tags,
  "icon": icon.asset->url,
  order,
  status
}`;
