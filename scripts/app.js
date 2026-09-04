import { lessons, vocabulary } from '../data/index.js';
import { createDefaultState, exportState, loadState, readStateFile, recordStudyDate, saveState } from './state.js';
import { speakJapanese } from './speech.js';
import { escapeHtml, showToast, todayKey } from './utils.js';
import {
	lessonForDay, partsForDay, renderHome, renderLesson, renderProgress, renderQuiz,
	renderReview, renderSettings, renderSources, renderVocabulary, renderWordCard,
	stageForDay, wordKey
} from './views.js';

let state = loadState();
let route = 'home';
let selectedDay = Math.max(1, Math.min(100, state.currentDay || 1));
let vocabularyFilter = 'today';
let quizSelections = {};
let activeQuiz = [];
let installPrompt = null;

function persist() {
	saveState(state);
}

function recordStudy() {
	recordStudyDate(state);
	persist();
}

function markPart(day, key) {
	state.parts[day] = { ...partsForDay(state, day), [key]: true };
	const parts = state.parts[day];
	if (parts.grammar && parts.vocab && parts.practice && parts.quiz && !state.completedDays.includes(day)) {
		state.completedDays.push(day);
		state.completedDays.sort((a, b) => a - b);
		if (day === state.currentDay && day < 100) state.currentDay = day + 1;
		showToast(`Day ${day} 完成`);
	}
	recordStudy();
}

function navigate(nextRoute) {
	route = nextRoute;
	render();
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
	const container = document.getElementById('app-content');
	if (!container) return;

	if (route === 'home') container.innerHTML = renderHome(state);
	else if (route === 'lesson') container.innerHTML = renderLesson(selectedDay, state);
	else if (route === 'quiz') {
		const result = renderQuiz(selectedDay, state);
		activeQuiz = result.questions;
		quizSelections = {};
		container.innerHTML = result.html;
	}
	else if (route === 'vocabulary') container.innerHTML = renderVocabulary(state, vocabularyFilter);
	else if (route === 'review') container.innerHTML = renderReview(state);
	else if (route === 'progress') container.innerHTML = renderProgress(state);
	else if (route === 'sources') container.innerHTML = renderSources();
	else container.innerHTML = renderSettings(state);

	document.querySelectorAll('[data-route]').forEach((button) => {
		button.classList.toggle('active', button.dataset.route === route);
	});
	bindPageEvents();
}

function bindWordControls() {
	document.querySelectorAll('[data-familiarity]').forEach((button) => {
		button.addEventListener('click', () => {
			const group = button.closest('[data-word-key]');
			state.vocab[group.dataset.wordKey] = Number(button.dataset.familiarity);
			recordStudy();
			render();
		});
	});
}

function bindPracticeChoices() {
	document.querySelectorAll('.choice-group .practice-option').forEach((button) => {
		button.addEventListener('click', () => {
			const group = button.closest('.choice-group');
			group.querySelectorAll('.practice-option').forEach((option) => option.classList.remove('selected'));
			button.classList.add('selected');
		});
	});
}

function validatePractice() {
	const groups = [...document.querySelectorAll('.choice-group')];
	if (!groups.length) return true;
	let allAnswered = true;
	let allCorrect = true;

	groups.forEach((group) => {
		const selected = group.querySelector('.selected');
		if (!selected) {
			allAnswered = false;
			return;
		}
		const answer = Number(group.dataset.answer);
		const chosen = Number(selected.dataset.choice);
		group.querySelectorAll('.practice-option').forEach((option) => {
			option.classList.remove('correct', 'wrong');
			if (Number(option.dataset.choice) === answer) option.classList.add('correct');
		});
		if (chosen !== answer) {
			selected.classList.add('wrong');
			allCorrect = false;
		}
		const feedback = group.parentElement.querySelector('.practice-feedback');
		if (feedback) feedback.innerHTML = `<div class="translation-box p-2">中文：${escapeHtml(feedback.dataset.translation || '')}</div>`;
	});

	if (!allAnswered) {
		showToast('每一個練習都先選答案');
		return false;
	}
	if (!allCorrect) {
		showToast('有題目答錯，先看正解再完成');
		return false;
	}
	return true;
}

function submitQuiz() {
	if (Object.keys(quizSelections).length < activeQuiz.length) {
		showToast(`還有 ${activeQuiz.length - Object.keys(quizSelections).length} 題沒作答`);
		return;
	}

	let score = 0;
	activeQuiz.forEach((question, index) => {
		const card = document.querySelector(`[data-question-index="${index}"]`);
		const chosen = quizSelections[index];
		if (chosen === question.answer) score += 1;

		card.querySelectorAll('.quiz-option').forEach((button, optionIndex) => {
			button.classList.remove('selected');
			if (optionIndex === question.answer) button.classList.add('correct');
			else if (optionIndex === chosen) button.classList.add('wrong');
			button.disabled = true;
		});

		card.querySelector('.quiz-feedback').innerHTML = `<div class="quiz-explain"><b>${chosen === question.answer ? '✓ 正確' : '✕ 正解已標示'}</b><div class="mt-1">${escapeHtml(question.explain)}</div></div>`;
	});

	const passScore = Math.ceil(activeQuiz.length * 0.75);
	const passed = score >= passScore;
	state.quizHistory.push({ day: selectedDay, score, total: activeQuiz.length, date: todayKey(), pass: passed });
	if (passed) markPart(selectedDay, 'quiz');
	else recordStudy();

	const submitButton = document.getElementById('submit-quiz-button');
	submitButton.disabled = true;
	submitButton.textContent = `${score}/${activeQuiz.length} · ${passed ? '通過' : `未達 ${passScore} 題`}`;
	submitButton.className = `btn btn-lg w-100 fw-bold ${passed ? 'btn-success' : 'btn-outline-danger'}`;
	window.scrollTo({ top: 0, behavior: 'smooth' });
	showToast(passed ? `通過：${score}/${activeQuiz.length}` : `${score}/${activeQuiz.length}，至少 ${passScore} 題才通過`);
}

function learnedVocabulary(day) {
	const learned = new Map();
	for (const lesson of lessons.slice(0, day)) {
		for (const word of lesson.vocabulary) {
			if (word.kind === 'new') learned.set(wordKey(word), word);
		}
	}
	return [...learned.values()];
}

function filterVocabulary(query) {
	const learned = learnedVocabulary(state.currentDay);
	let list = vocabularyFilter === 'today' ? lessonForDay(state.currentDay).vocabulary
		: vocabularyFilter === 'weak' ? learned.filter((word) => (state.vocab[wordKey(word)] || 0) < 2)
			: vocabularyFilter === 'known' ? learned.filter((word) => (state.vocab[wordKey(word)] || 0) >= 2)
				: vocabulary;

	const keyword = query.trim().toLowerCase();
	if (keyword) list = list.filter((word) => `${word.word} ${word.reading} ${word.meaning}`.toLowerCase().includes(keyword));

	const target = document.getElementById('vocabulary-list');
	target.innerHTML = list.map((word) => renderWordCard(word, state.currentDay, state)).join('') || '<div class="py-5 text-center text-body-secondary">找不到單字</div>';
	bindWordControls();
}

function bindPageEvents() {
	const byId = (id) => document.getElementById(id);

	byId('start-today-button')?.addEventListener('click', () => { selectedDay = state.currentDay; navigate('lesson'); });
	byId('open-today-lesson-button')?.addEventListener('click', () => { selectedDay = state.currentDay; navigate('lesson'); });
	byId('open-progress-button')?.addEventListener('click', () => navigate('progress'));
	byId('open-settings-button')?.addEventListener('click', () => navigate('settings'));
	byId('open-settings-progress-button')?.addEventListener('click', () => navigate('progress'));
	byId('open-sources-button')?.addEventListener('click', () => navigate('sources'));

	byId('previous-day-button')?.addEventListener('click', () => { selectedDay = Math.max(1, selectedDay - 1); render(); });
	byId('next-day-button')?.addEventListener('click', () => { selectedDay = Math.min(100, selectedDay + 1); render(); });
	document.querySelectorAll('[data-open-day]').forEach((button) => button.addEventListener('click', () => { selectedDay = Number(button.dataset.openDay); navigate('lesson'); }));

	byId('complete-grammar-button')?.addEventListener('click', () => { markPart(selectedDay, 'grammar'); render(); });
	byId('complete-vocabulary-button')?.addEventListener('click', () => { markPart(selectedDay, 'vocab'); render(); });
	byId('complete-practice-button')?.addEventListener('click', () => { if (validatePractice()) { markPart(selectedDay, 'practice'); render(); } });
	byId('open-quiz-button')?.addEventListener('click', () => navigate('quiz'));
	byId('back-to-lesson-button')?.addEventListener('click', () => navigate('lesson'));

	document.querySelectorAll('.quiz-option').forEach((button) => button.addEventListener('click', () => {
		const questionIndex = Number(button.dataset.question);
		quizSelections[questionIndex] = Number(button.dataset.option);
		button.closest('.quiz-q').querySelectorAll('.quiz-option').forEach((option) => option.classList.remove('selected'));
		button.classList.add('selected');
	}));
	byId('submit-quiz-button')?.addEventListener('click', submitQuiz);

	document.querySelectorAll('[data-vocabulary-filter]').forEach((button) => button.addEventListener('click', () => {
		vocabularyFilter = button.dataset.vocabularyFilter;
		render();
	}));
	byId('vocabulary-search')?.addEventListener('input', (event) => filterVocabulary(event.target.value));

	byId('furigana-policy')?.addEventListener('change', (event) => { state.furiganaPolicy = event.target.value; persist(); render(); });
	byId('furigana-style')?.addEventListener('change', (event) => { state.furiganaStyle = event.target.value; persist(); render(); });
	byId('speech-voice')?.addEventListener('change', (event) => { state.speechVoice = event.target.value; persist(); });
	byId('speech-rate')?.addEventListener('input', (event) => { state.speechRate = Number(event.target.value); byId('speech-rate-value').textContent = state.speechRate; persist(); });
	byId('speech-volume')?.addEventListener('input', (event) => { state.speechVolume = Number(event.target.value); byId('speech-volume-value').textContent = Math.round(state.speechVolume * 100); persist(); });

	byId('export-data-button')?.addEventListener('click', () => exportState(state));
	byId('import-data-button')?.addEventListener('click', () => byId('import-data-file').click());
	byId('import-data-file')?.addEventListener('change', async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		try {
			state = await readStateFile(file);
			persist();
			selectedDay = state.currentDay;
			showToast('學習資料已匯入');
			window.setTimeout(() => navigate('home'), 400);
		} catch {
			showToast('備份檔格式不正確');
		}
	});

	byId('reset-progress-button')?.addEventListener('click', () => {
		if (!window.confirm('確定清除全部學習紀錄？這無法復原。')) return;
		state = createDefaultState();
		persist();
		selectedDay = 1;
		navigate('home');
	});

	bindWordControls();
	bindPracticeChoices();
}

document.addEventListener('click', (event) => {
	const routeButton = event.target.closest('[data-route]');
	if (routeButton) navigate(routeButton.dataset.route);

	const speechButton = event.target.closest('[data-speak]');
	if (speechButton) speakJapanese(speechButton.dataset.speak, state);
});

window.addEventListener('beforeinstallprompt', (event) => {
	event.preventDefault();
	installPrompt = event;
	const button = document.getElementById('install-app-button');
	if (!button) return;
	button.classList.remove('d-none');
	button.addEventListener('click', async () => {
		await installPrompt.prompt();
		installPrompt = null;
		button.classList.add('d-none');
	}, { once: true });
});

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { }));
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();

render();