export const projectsQuery = `*[_type == "project"] | order(order asc) {
  "id": slug.current,
  name,
  "image": image.asset->url,
  "detail": {
    "description": description,
    "year": year,
    "category": category,
    "client": client,
    "tags": tags,
    "role": role,
    "gallery": gallery[].asset->url,
    "externalUrl": externalUrl
  }
}`;
