const current = new URL(location.href);
const legacyLink = current.searchParams.has('type') || current.searchParams.has('reel') ||
  current.searchParams.get('utm_content') === 'link_in_bio' || current.hash;
if (legacyLink) {
  const destination = new URL('./elementec/', current);
  destination.search = current.search;
  destination.hash = current.hash;
  location.replace(destination.href);
}
