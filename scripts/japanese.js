import { lessons } from '../data/index.js';
import { escapeHtml } from './utils.js';

const kanjiPattern = /[一-龯々]/;
const kanaPattern = /[ぁ-ゖァ-ヺー]/;
const introducedOn = new Map();

for (const lesson of lessons) {
	for (const word of lesson.vocabulary) {
		if (word.kind === 'new' && !introducedOn.has(word.id)) introducedOn.set(word.id, lesson.day);
	}
}

const candidates = new Map();
const forced = new Map([
	['田中', { reading: 'たなか', intro: 1 }],
	['山田', { reading: 'やまだ', intro: 1 }],
	['台湾', { reading: 'たいわん', intro: 1 }],
	['台南', { reading: 'たいなん', intro: 1 }],
	['台北', { reading: 'たいぺい', intro: 1 }],
	['日本', { reading: 'にほん', intro: 1 }],
	['東京', { reading: 'とうきょう', intro: 1 }],
	['京都', { reading: 'きょうと', intro: 1 }],
	['大阪', { reading: 'おおさか', intro: 1 }],
	['北海道', { reading: 'ほっかいどう', intro: 1 }],
	['富士山', { reading: 'ふじさん', intro: 1 }]
]);

function addCandidate(surface, reading, intro) {
	if (!surface || !reading || !kanjiPattern.test(surface)) return;
	if (!candidates.has(surface)) candidates.set(surface, new Map());
	const readings = candidates.get(surface);
	const current = readings.get(reading);
	readings.set(reading, current ? Math.min(current, intro) : intro);
}

for (const lesson of lessons) {
	for (const word of lesson.vocabulary) {
		if (word.kind !== 'new') continue;
		const intro = lesson.day;
		addCandidate(word.word, word.reading, intro);

		let wordIndex = word.word.length - 1;
		let readingIndex = word.reading.length - 1;
		while (
			wordIndex >= 0 && readingIndex >= 0 &&
			word.word[wordIndex] === word.reading[readingIndex] &&
			kanaPattern.test(word.word[wordIndex])
		) {
			wordIndex -= 1;
			readingIndex -= 1;
		}
		const surface = word.word.slice(0, wordIndex + 1);
		const reading = word.reading.slice(0, readingIndex + 1);
		if (surface.length >= 1 && surface.length <= 4) addCandidate(surface, reading, intro);
	}
}

const sentenceEntries = [];
for (const [surface, readings] of candidates) {
	if (forced.has(surface)) continue;
	// If the same written form has multiple readings, do not guess in a sentence.
	if (readings.size !== 1) continue;
	const [[reading, intro]] = readings.entries();
	sentenceEntries.push({ surface, reading, intro });
}
for (const [surface, value] of forced) sentenceEntries.push({ surface, ...value });
sentenceEntries.sort((a, b) => b.surface.length - a.surface.length);

function shouldShowFurigana(intro, day, state, exam = false) {
	if (state.furiganaPolicy === 'off') return false;
	if (state.furiganaPolicy === 'all') return true;
	if (exam || day >= 91) return false;
	if (day <= 20) return true;
	if (day <= 40) return intro >= day - 15;
	if (day <= 60) return intro >= day - 8;
	if (day <= 80) return intro >= day - 4;
	return intro >= day - 2;
}

function withReading(surface, reading, state) {
	if (state.furiganaStyle === 'paren') {
		return `${escapeHtml(surface)}<span class="paren-furi">(${escapeHtml(reading)})</span>`;
	}
	return `<ruby>${escapeHtml(surface)}<rt>${escapeHtml(reading)}</rt></ruby>`;
}

export function renderWordJapanese(word, day, state) {
	if (!kanjiPattern.test(word.word)) return escapeHtml(word.word);
	const intro = introducedOn.get(word.id) || day;
	if (!shouldShowFurigana(intro, day, state)) return escapeHtml(word.word);

	let wordIndex = word.word.length - 1;
	let readingIndex = word.reading.length - 1;
	while (
		wordIndex >= 0 && readingIndex >= 0 &&
		word.word[wordIndex] === word.reading[readingIndex] &&
		kanaPattern.test(word.word[wordIndex])
	) {
		wordIndex -= 1;
		readingIndex -= 1;
	}

	const surface = word.word.slice(0, wordIndex + 1);
	const reading = word.reading.slice(0, readingIndex + 1);
	const suffix = word.word.slice(wordIndex + 1);
	if (!surface || !reading || !kanjiPattern.test(surface)) return withReading(word.word, word.reading, state);
	return `${withReading(surface, reading, state)}${escapeHtml(suffix)}`;
}

export function renderJapanese(text, day, state, options = {}) {
	const raw = String(text ?? '');
	const hiddenWords = new Set(options.hide || []);
	let output = '';
	let index = 0;

	while (index < raw.length) {
		const entry = sentenceEntries.find((item) => raw.startsWith(item.surface, index));
		if (!entry) {
			output += escapeHtml(raw[index]);
			index += 1;
			continue;
		}

		if (hiddenWords.has(entry.surface) || !shouldShowFurigana(entry.intro, day, state, Boolean(options.exam))) {
			output += escapeHtml(entry.surface);
		} else {
			output += withReading(entry.surface, entry.reading, state);
		}
		index += entry.surface.length;
	}
	return output;
}

export function renderExerciseJapanese(text) {
	return escapeHtml(String(text ?? ''));
}

export function containsKanji(text) {
	return kanjiPattern.test(String(text ?? ''));
}