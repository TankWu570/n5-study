const CACHE_NAME = 'n5-study-static-v1';
const APP_SHELL = [
	'./',
	'./index.html',
	'./manifest.webmanifest',
	'./assets/icons/app-icon.svg',
	'./assets/icons/app-icon-192.png',
	'./assets/icons/app-icon-512.png',
	'./assets/icons/apple-touch-icon.png',
	'./styles/app.css',
	'./scripts/app.js',
	'./scripts/state.js',
	'./scripts/speech.js',
	'./scripts/japanese.js',
	'./scripts/quiz.js',
	'./scripts/utils.js',
	'./scripts/views.js',
	'./data/index.js',
	'./data/curriculum.js',
	'./data/vocabulary.js',
	'./data/vocabulary-plan.js',
	'./data/lessons/01-20.js',
	'./data/lessons/21-40.js',
	'./data/lessons/41-60.js',
	'./data/lessons/61-80.js',
	'./data/lessons/81-100.js'
];

self.addEventListener('install', (event) => {
	self.skipWaiting();
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(Promise.all([
		self.clients.claim(),
		caches.keys().then((keys) => Promise.all(
			keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
		))
	]));
});

async function networkFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	try {
		const response = await fetch(request);
		if (response.ok) cache.put(request, response.clone());
		return response;
	} catch {
		return (await cache.match(request)) || cache.match('./index.html');
	}
}

async function staleWhileRevalidate(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	const network = fetch(request).then((response) => {
		if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
		return response;
	}).catch(() => null);

	if (cached) {
		network.catch(() => null);
		return cached;
	}
	return (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	if (event.request.mode === 'navigate') {
		event.respondWith(networkFirst(event.request));
		return;
	}
	event.respondWith(staleWhileRevalidate(event.request));
});