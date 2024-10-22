export function cleanTags(tags) {
  return tags.split(",").map((tag) => {
    const trimmedTag = tag.trim();
    return (
      trimmedTag.charAt(0).toUpperCase() + trimmedTag.slice(1).toLowerCase()
    );
  });
}
