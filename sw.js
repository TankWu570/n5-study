const CACHE_NAME = 'n5-study-app-cache';
const APP_SHELL = [
	"./",
	"./index.html",
	"./manifest.webmanifest",
	"./assets/icons/app-icon.svg",
	"./styles/app.css",
	"./scripts/app.js",
	"./scripts/state.js",
	"./scripts/speech.js",
	"./scripts/japanese.js",
	"./scripts/quiz.js",
	"./scripts/utils.js",
	"./scripts/views.js",
	"./data/index.js",
	"./data/curriculum.js",
	"./data/vocabulary.js",
	"./data/lessons/01-20.js",
	"./data/lessons/21-40.js",
	"./data/lessons/41-60.js",
	"./data/lessons/61-80.js",
	"./data/lessons/81-100.js"
];

self.addEventListener('install', (event) => {
	self.skipWaiting();
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(Promise.all([
		self.clients.claim(),
		caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
	]));
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	event.respondWith(
		caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
			const copy = response.clone();
			caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
			return response;
		}))
	);
});