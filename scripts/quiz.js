import { lessons } from '../data/index.js';
import { containsKanji } from './japanese.js';
import { seededShuffle } from './utils.js';

const wordKey = (word) => `${word.word}|${word.reading}`;

function learnedVocabulary(day) {
	const learned = new Map();
	for (let index = 0; index < day; index += 1) {
		for (const word of lessons[index].vocabulary || []) {
			if (word.kind === 'new') learned.set(wordKey(word), word);
		}
	}
	return [...learned.values()];
}

function learnedExamples(day) {
	const examples = [];
	for (let index = 0; index < day; index += 1) {
		lessons[index].examples.forEach((jp, exampleIndex) => {
			examples.push({ jp, zh: lessons[index].exampleZh[exampleIndex], day: index + 1 });
		});
	}
	return examples;
}

function optionSet(correct, pool, seed, max = 4) {
	const alternatives = seededShuffle([...new Set(pool.filter((item) => item && item !== correct))], seed);
	return seededShuffle([correct, ...alternatives.slice(0, max - 1)], seed + 19);
}

function question(type, prompt, options, correct, explanation, extra = {}) {
	return { type, q: prompt, options, answer: options.indexOf(correct), explain: explanation, ...extra };
}

function distortedSentences(sentence) {
	const output = [];
	if (sentence.includes('は')) output.push(sentence.replace('は', ''));
	if (sentence.endsWith('です。')) {
		output.push(sentence.replace('です。', '。'));
		output.push(sentence.replace('です。', 'ですです。'));
	}
	const plain = sentence.replace(/[。？?]/g, '');
	if (plain.length > 5) {
		const middle = Math.floor(plain.length / 2);
		output.push(plain.slice(middle) + plain.slice(0, middle) + '。');
	}
	output.push(`です。${plain}`);
	return [...new Set(output)].filter((item) => item !== sentence);
}

function previousTranslations(day, count) {
	const pool = [];
	for (let index = Math.max(1, day - 12); index <= day; index += 1) {
		for (const translation of lessons[index - 1].exampleZh || []) {
			if (translation) pool.push(translation);
		}
	}
	return seededShuffle([...new Set(pool)], day * 71).slice(0, count);
}

export function buildReadingPractice(lesson, day) {
	const target = Math.min(1, lesson.examples.length - 1);
	const correct = lesson.exampleZh[target];
	const options = seededShuffle(
		[correct, ...previousTranslations(day, 6).filter((item) => item !== correct)].slice(0, 4),
		day * 307
	);
	return {
		text: lesson.examples.join('　'),
		q: '第二句的意思最接近哪一個？',
		options,
		answer: options.indexOf(correct),
		zh: lesson.examples.map((text, index) => `${text}＝${lesson.exampleZh[index]}`).join('／')
	};
}

export function buildListeningPractice(lesson, day) {
	const target = day >= 51 ? Math.min(1, lesson.examples.length - 1) : 0;
	const audio = day >= 51 ? `${lesson.examples[0]} ${lesson.examples[target]}` : lesson.examples[target];
	const correct = lesson.exampleZh[target];
	const options = seededShuffle(
		[correct, ...previousTranslations(day, 6).filter((item) => item !== correct)].slice(0, 4),
		day * 401
	);
	return {
		audio,
		q: day >= 51 ? '剛才第二句的意思是？' : '剛才這句的意思是？',
		options,
		answer: options.indexOf(correct),
		zh: `${lesson.examples[target]}＝${correct}`
	};
}

export function generateQuiz(lesson, stage) {
	const day = lesson.day;
	const target = stage.quizCount;
	const learned = learnedVocabulary(day);
	const examples = learnedExamples(day);
	const current = lesson.vocabulary;
	const newWords = current.filter((word) => word.kind === 'new');
	const basis = newWords.length ? newWords : current;
	const questions = [];
	const seed = day * 1009;
	const kanjiWords = learned.filter((word) => containsKanji(word.word));

	for (let index = 0; index < Math.min(4, target); index += 1) {
		const word = basis[index % basis.length];
		if (index % 2 === 0) {
			const options = optionSet(word.meaning, learned.map((item) => item.meaning), seed + index);
			questions.push(question('單字意思', `「${word.word}」是什麼意思？`, options, word.meaning, `${word.word}（${word.reading}）：${word.meaning}`));
		} else {
			const options = optionSet(word.word, learned.map((item) => item.word), seed + index);
			questions.push(question('日文選擇', `哪個日文是「${word.meaning}」？`, options, word.word, `正解：${word.word}（${word.reading}）`));
		}
	}

	if (kanjiWords.length) {
		const word = kanjiWords[(day * 3) % kanjiWords.length];
		const options = optionSet(word.reading, learned.map((item) => item.reading), seed + 11);
		questions.push(question('漢字讀音', `「${word.word}」怎麼讀？`, options, word.reading, `「${word.word}」讀作「${word.reading}」，意思是「${word.meaning}」。`));
	}

	const example = lesson.examples[0];
	const sentenceOptions = seededShuffle([example, ...distortedSentences(example)].slice(0, 4), seed + 17);
	questions.push(question('句型辨認', '哪一句最符合今天學過的句型？', sentenceOptions, example, `今天的核心句型是「${lesson.pattern}」。正確例句：${example}`));

	const exampleItem = examples[(day * 5) % examples.length];
	const translationOptions = optionSet(exampleItem.zh, examples.map((item) => item.zh), seed + 23);
	questions.push(question('句子理解', `「${exampleItem.jp}」最接近哪個意思？`, translationOptions, exampleItem.zh, `${exampleItem.jp} → ${exampleItem.zh}`));

	if (day > 1) {
		const previous = lessons[Math.max(0, day - 2)];
		const jp = previous.examples[0];
		const zh = previous.exampleZh[0];
		const options = optionSet(zh, examples.map((item) => item.zh), seed + 31);
		questions.push(question('舊內容複習', `「${jp}」是什麼意思？`, options, zh, `這是 Day ${previous.day} 的間隔複習。${jp} → ${zh}`));
	}

	if (stage.id === 'sentence') {
		const jp = lesson.examples[0];
		const zh = lesson.exampleZh[0];
		const options = optionSet(zh, examples.map((item) => item.zh), seed + 40);
		questions.push(question('聽句辨意', '🔊 聽一句，選出意思。', options, zh, `${jp} → ${zh}`, { audio: jp }));
	}

	if (['micro', 'integrated', 'jlpt_intro', 'exam', 'mock', 'final'].includes(stage.id)) {
		if (stage.id === 'micro') {
			const jp = lesson.examples[1];
			const zh = lesson.exampleZh[1];
			const options = optionSet(zh, examples.map((item) => item.zh), seed + 41);
			questions.push(question('超短閱讀', `「${jp}」的意思是？`, options, zh, `${jp} → ${zh}`));
			questions.push(question('短句聽辨', '🔊 聽句子，選出意思。', options, zh, `${jp} → ${zh}`, { audio: jp }));
		} else {
			const isMock = ['mock', 'final'].includes(stage.id);
			const reading = isMock ? lesson.reading : buildReadingPractice(lesson, day);
			questions.push({ type: '讀解', q: reading.q, options: reading.options, answer: reading.answer, explain: `內容解析：${reading.zh}`, passage: reading.text });
			const listening = isMock
				? { audio: lesson.listening.text, q: lesson.listening.q, options: lesson.listening.options, answer: lesson.listening.answer, zh: lesson.listening.zh }
				: buildListeningPractice(lesson, day);
			questions.push({ type: '聽解', q: listening.q, options: listening.options, answer: listening.answer, explain: `聽力內容：${listening.zh}`, audio: listening.audio });
		}
	}

	let index = 0;
	while (questions.length < target) {
		const word = learned[(seed + index * 7) % learned.length] || current[index % current.length];
		const mode = index % 3;
		if (mode === 0 && containsKanji(word.word)) {
			const options = optionSet(word.reading, learned.map((item) => item.reading), seed + 100 + index);
			questions.push(question('讀音複習', `「${word.word}」怎麼讀？`, options, word.reading, `${word.word}（${word.reading}）：${word.meaning}`));
		} else if (mode === 1) {
			const options = optionSet(word.meaning, learned.map((item) => item.meaning), seed + 100 + index);
			questions.push(question('語彙複習', `「${word.word}」的意思是？`, options, word.meaning, `${word.word}（${word.reading}）：${word.meaning}`));
		} else {
			const learnedExample = examples[(seed + index) % examples.length];
			const options = optionSet(learnedExample.zh, examples.map((item) => item.zh), seed + 100 + index);
			questions.push(question('例句複習', `「${learnedExample.jp}」最接近哪個意思？`, options, learnedExample.zh, `${learnedExample.jp} → ${learnedExample.zh}`));
		}
		index += 1;
		if (index > 200) break;
	}

	return questions.slice(0, target);
}