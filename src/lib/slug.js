// Turns a title into a URL-friendly slug. Used for project detail page URLs.
export const slugify = (str = "") =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
