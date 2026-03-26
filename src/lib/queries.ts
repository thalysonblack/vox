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
