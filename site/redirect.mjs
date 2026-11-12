const link = document.getElementById('destination');
const destination = new URL(link.href);
destination.search = location.search;
destination.hash = location.hash;
link.href = destination.href;
location.replace(destination.href);
