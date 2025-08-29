function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[\s\_]+/g, '-')      // spaces/underscores -> dash
    .replace(/[^a-z0-9\-]/g, '')   // drop non-url chars
    .replace(/\-+/g, '-');         // collapse dashes
}
module.exports = { slugify };
