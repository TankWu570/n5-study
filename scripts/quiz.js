import { lessons } from '../data/index.js';
import { containsKanji } from './japanese.js';
import { seededShuffle } from './utils.js';

const wordKey = (word) => `${word.word}|${word.reading}`;

function learnedVocabulary(day) {
	const learned = new Map();
	for (let index = 0; index < day; index += 1) {
		for (const word of lessons[index].vocabulary) {
			if (word.kind === 'new') learned.set(wordKey(word), word);
		}
	}
	return [...learned.values()];
}

function learnedExamples(day) {
	const examples = [];
	for (let index = 0; index < day; index += 1) {
		for (const example of lessons[index].examples) {
			examples.push({ ...example, day: index + 1 });
		}
	}
	return examples;
}

function learnedChecks(day) {
	return lessons.slice(0, day).filter((lesson) => lesson.check).map((lesson) => ({ ...lesson.check, day: lesson.day }));
}

function optionSet(correct, pool, seed, max = 4) {
	const alternatives = seededShuffle(
		[...new Set(pool.filter((item) => item && item !== correct))],
		seed
	);
	return seededShuffle([correct, ...alternatives.slice(0, max - 1)], seed + 19);
}

function createQuestion(type, prompt, options, correct, explanation, extra = {}) {
	return { type, q: prompt, options, answer: options.indexOf(correct), explain: explanation, ...extra };
}

function previousTranslations(day, count, seed = day * 71) {
	const pool = [];
	for (let index = Math.max(1, day - 12); index <= day; index += 1) {
		for (const example of lessons[index - 1].examples) if (example.zh) pool.push(example.zh);
	}
	return seededShuffle([...new Set(pool)], seed).slice(0, count);
}

export function buildReadingPractice(lesson, day, attempt = 1) {
	const target = Math.min(1, lesson.examples.length - 1);
	const correct = lesson.examples[target].zh;
	const options = optionSet(
		correct,
		previousTranslations(day, 10, day * 307 + attempt),
		day * 307 + attempt
	);
	return {
		text: lesson.examples.map((item) => item.jp).join('　'),
		q: '第二句的意思最接近哪一個？',
		options,
		answer: options.indexOf(correct),
		zh: lesson.examples.map((item) => `${item.jp}＝${item.zh}`).join('／')
	};
}

export function buildListeningPractice(lesson, day, attempt = 1) {
	const target = day >= 51 ? Math.min(1, lesson.examples.length - 1) : 0;
	const audio = day >= 51
		? `${lesson.examples[0].jp} ${lesson.examples[target].jp}`
		: lesson.examples[target].jp;
	const correct = lesson.examples[target].zh;
	const options = optionSet(
		correct,
		previousTranslations(day, 10, day * 401 + attempt),
		day * 401 + attempt
	);
	return {
		audio,
		q: day >= 51 ? '剛才第二句的意思是？' : '剛才這句的意思是？',
		options,
		answer: options.indexOf(correct),
		zh: `${lesson.examples[target].jp}＝${correct}`
	};
}

export function generateQuiz(lesson, stage, attempt = 1) {
	const day = lesson.day;
	const target = stage.quizCount;
	const seed = day * 1009 + attempt * 7919;
	const learned = learnedVocabulary(day);
	const examples = learnedExamples(day);
	const checks = learnedChecks(day);
	const current = lesson.vocabulary;
	const newWords = current.filter((word) => word.kind === 'new');
	const basis = newWords.length ? newWords : current;
	const kanjiWords = learned.filter((word) => containsKanji(word.word));
	const questions = [];
	const signatures = new Set();

	function add(question) {
		if (!question || question.answer < 0 || question.options.length < 2) return;
		const signature = `${question.type}|${question.q}|${question.audio || ''}`;
		if (signatures.has(signature)) return;
		signatures.add(signature);
		questions.push(question);
	}

	const rotatedBasis = seededShuffle(basis, seed);
	for (let index = 0; index < Math.min(4, target); index += 1) {
		const word = rotatedBasis[index % rotatedBasis.length];
		if (index % 2 === 0) {
			const options = optionSet(word.meaning, learned.map((item) => item.meaning), seed + index);
			add(createQuestion('單字意思', `「${word.word}」是什麼意思？`, options, word.meaning, `${word.word}（${word.reading}）：${word.meaning}`));
		} else {
			const options = optionSet(word.word, learned.map((item) => item.word), seed + index);
			add(createQuestion('日文選擇', `哪個日文是「${word.meaning}」？`, options, word.word, `正解：${word.word}（${word.reading}）`));
		}
	}

	if (kanjiWords.length) {
		const word = seededShuffle(kanjiWords, seed + 11)[0];
		const options = optionSet(word.reading, learned.map((item) => item.reading), seed + 12);
		add(createQuestion('漢字讀音', `「${word.word}」怎麼讀？`, options, word.reading, `「${word.word}」讀作「${word.reading}」，意思是「${word.meaning}」。`));
	}

	const recentChecks = seededShuffle(checks.filter((item) => item.day >= Math.max(1, day - 12)), seed + 17);
	for (const check of recentChecks.slice(0, target >= 15 ? 3 : 1)) {
		add({
			type: '文法', q: check.q, options: [...check.options], answer: check.answer,
			explain: `${check.explain}（Day ${check.day}）`
		});
	}

	if (examples.length) {
		const example = seededShuffle(examples, seed + 23)[0];
		const options = optionSet(example.zh, examples.map((item) => item.zh), seed + 24);
		add(createQuestion('句子理解', `「${example.jp}」最接近哪個意思？`, options, example.zh, `${example.jp} → ${example.zh}`));
	}

	if (day > 1) {
		const previous = lessons[day - 2];
		const example = previous.examples[0];
		const options = optionSet(example.zh, examples.map((item) => item.zh), seed + 31);
		add(createQuestion('舊內容複習', `「${example.jp}」是什麼意思？`, options, example.zh, `這是 Day ${previous.day} 的間隔複習。${example.jp} → ${example.zh}`));
	}

	if (stage.id === 'sentence') {
		const example = lesson.examples[0];
		const options = optionSet(example.zh, examples.map((item) => item.zh), seed + 40);
		add(createQuestion('聽句辨意', '🔊 聽一句，選出意思。', options, example.zh, `${example.jp} → ${example.zh}`, { audio: example.jp }));
	}

	if (stage.id === 'micro') {
		const example = lesson.examples[Math.min(1, lesson.examples.length - 1)];
		const options = optionSet(example.zh, examples.map((item) => item.zh), seed + 41);
		add(createQuestion('超短閱讀', `「${example.jp}」的意思是？`, options, example.zh, `${example.jp} → ${example.zh}`));
		add(createQuestion('短句聽辨', '🔊 聽句子，選出意思。', options, example.zh, `${example.jp} → ${example.zh}`, { audio: example.jp }));
	}

	if (['integrated', 'jlpt_intro', 'exam'].includes(stage.id)) {
		const reading = buildReadingPractice(lesson, day, attempt);
		add({ type: '讀解', q: reading.q, options: reading.options, answer: reading.answer, explain: `內容解析：${reading.zh}`, passage: reading.text });
		const listening = buildListeningPractice(lesson, day, attempt);
		add({ type: '聽解', q: listening.q, options: listening.options, answer: listening.answer, explain: `聽力內容：${listening.zh}`, audio: listening.audio });
	}

	if (['mock', 'final'].includes(stage.id) && lesson.exam) {
		for (const reading of lesson.exam.readings || []) {
			add({ type: '讀解', q: reading.q, options: reading.options, answer: reading.answer, explain: `內容解析：${reading.zh}`, passage: reading.text });
		}
		for (const listening of lesson.exam.listenings || []) {
			add({ type: '聽解', q: listening.q, options: listening.options, answer: listening.answer, explain: `聽力內容：${listening.zh}`, audio: listening.text });
		}
	}

	let index = 0;
	while (questions.length < target && index < 500) {
		const mode = index % 4;
		if (mode === 0 && learned.length) {
			const word = learned[(seed + index * 7) % learned.length];
			const options = optionSet(word.meaning, learned.map((item) => item.meaning), seed + 100 + index);
			add(createQuestion('語彙複習', `「${word.word}」的意思是？`, options, word.meaning, `${word.word}（${word.reading}）：${word.meaning}`));
		} else if (mode === 1 && kanjiWords.length) {
			const word = kanjiWords[(seed + index * 5) % kanjiWords.length];
			const options = optionSet(word.reading, learned.map((item) => item.reading), seed + 100 + index);
			add(createQuestion('讀音複習', `「${word.word}」怎麼讀？`, options, word.reading, `${word.word}（${word.reading}）：${word.meaning}`));
		} else if (mode === 2 && checks.length) {
			const check = checks[(seed + index) % checks.length];
			add({ type: '文法複習', q: check.q, options: [...check.options], answer: check.answer, explain: `${check.explain}（Day ${check.day}）` });
		} else if (examples.length) {
			const example = examples[(seed + index) % examples.length];
			const options = optionSet(example.zh, examples.map((item) => item.zh), seed + 100 + index);
			add(createQuestion('例句複習', `「${example.jp}」最接近哪個意思？`, options, example.zh, `${example.jp} → ${example.zh}`));
		}
		index += 1;
	}

	return seededShuffle(questions, seed + 999).slice(0, target);
}