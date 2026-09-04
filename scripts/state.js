
import { todayKey } from './utils.js';
const STORAGE_KEY = 'n5-study-progress';

export function createDefaultState() {
	return {
		schema: 1,
		currentDay: 1,
		completedDays: [],
		parts: {},
		vocab: {},
		quizHistory: [],
		studyDates: [],
		speechRate: 0.85,
		speechVolume: 1,
		speechVoice: '',
		furiganaPolicy: 'auto',
		furiganaStyle: 'ruby'
	};
}

function normalizeState(input = {}) {
	const state = { ...createDefaultState(), ...input, schema: 1 };
	state.parts = Object.fromEntries(
		Object.entries(input.parts || {}).map(([day, part]) => [day, {
			grammar: Boolean(part.grammar),
			vocab: Boolean(part.vocab),
			practice: Boolean(part.practice || part.reading),
			quiz: Boolean(part.quiz)
		}])
	);
	return state;
}

function loadLegacyState() {
	const candidateKeys = Object.keys(localStorage).filter(
		(key) => key.startsWith('n5-study-') && key !== STORAGE_KEY
	);

	for (const key of candidateKeys) {
		const raw = localStorage.getItem(key);
		if (!raw) continue;
		try {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object' && ('currentDay' in parsed || 'completedDays' in parsed)) {
				return normalizeState(parsed);
			}
		} catch {
			// Ignore unrelated or unreadable values.
		}
	}
	return null;
}

export function loadState() {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) return normalizeState(JSON.parse(saved));

		const legacy = loadLegacyState();
		if (legacy) {
			saveState(legacy);
			return legacy;
		}
	} catch {
		// A broken local value should never prevent the app from opening.
	}
	return createDefaultState();
}

export function saveState(state) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordStudyDate(state) {
	const key = todayKey();
	if (!state.studyDates.includes(key)) state.studyDates.push(key);
}

export function exportState(state) {
	const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `n5-study-backup-${todayKey()}.json`;
	link.click();
	URL.revokeObjectURL(link.href);
}

export async function readStateFile(file) {
	const parsed = JSON.parse(await file.text());
	return normalizeState(parsed);
}