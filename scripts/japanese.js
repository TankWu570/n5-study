import { lessons, vocabulary } from '../data/index.js';
import { escapeHtml } from './utils.js';

const kanjiPattern = /[一-龯々]/;
const kanaPattern = /[ぁ-ゖァ-ヺー]/;
const introducedOn = new Map();

for (const lesson of lessons) {
	for (const word of lesson.vocabulary || []) {
		const key = `${word.word}|${word.reading}`;
		if (word.kind === 'new' && !introducedOn.has(key)) introducedOn.set(key, lesson.day);
	}
}

const manualReadings = [
	['田中', 'たなか', 1],
	['山田', 'やまだ', 1],
	['台湾', 'たいわん', 1],
	['台南', 'たいなん', 1],
	['台北', 'たいぺい', 1],
	['日本', 'にほん', 1],
	['東京', 'とうきょう', 1],
	['京都', 'きょうと', 1],
	['大阪', 'おおさか', 1],
	['富士山', 'ふじさん', 1]
];

const entries = [];
const seen = new Set();

function addEntry(surface, reading, intro = 1, exact = true) {
	if (!surface || !reading || !kanjiPattern.test(surface)) return;
	const key = `${surface}|${reading}`;
	if (seen.has(key)) return;
	seen.add(key);
	entries.push({ surface, reading, intro, exact });
}

for (const word of vocabulary) {
	const intro = introducedOn.get(`${word.word}|${word.reading}`) || 1;
	addEntry(word.word, word.reading, intro, true);

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
	if (surface && reading && kanjiPattern.test(surface) && surface.length <= 4) {
		addEntry(surface, reading, intro, false);
	}
}

manualReadings.forEach((entry) => addEntry(...entry));
entries.sort((a, b) => b.surface.length - a.surface.length || Number(b.exact) - Number(a.exact));

function shouldShowFurigana(entry, day, state, exam = false) {
	if (state.furiganaPolicy === 'off') return false;
	if (state.furiganaPolicy === 'all') return true;
	if (exam && day >= 91) return false;
	if (day <= 20) return true;
	if (day <= 40) return entry.intro >= day - 15;
	if (day <= 60) return entry.intro >= day - 8;
	if (day <= 80) return entry.intro >= day - 4;
	if (day <= 90) return entry.intro >= day - 2;
	return false;
}

export function renderJapanese(text, day, state, options = {}) {
	const raw = String(text ?? '');
	const hiddenWords = new Set(options.hide || []);
	let output = '';
	let index = 0;

	while (index < raw.length) {
		const entry = entries.find((item) => raw.startsWith(item.surface, index));
		if (!entry) {
			output += escapeHtml(raw[index]);
			index += 1;
			continue;
		}

		if (hiddenWords.has(entry.surface) || !shouldShowFurigana(entry, day, state, Boolean(options.exam))) {
			output += escapeHtml(entry.surface);
		} else if (state.furiganaStyle === 'paren') {
			output += `${escapeHtml(entry.surface)}<span class="paren-furi">(${escapeHtml(entry.reading)})</span>`;
		} else {
			output += `<ruby>${escapeHtml(entry.surface)}<rt>${escapeHtml(entry.reading)}</rt></ruby>`;
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