import { lessons, vocabulary, vocabularyPlan } from '../data/index.js';

const errors = [];
const warn = [];
const fail = (message) => errors.push(message);

if (lessons.length !== 100) fail(`課程天數應為 100，目前為 ${lessons.length}`);
if (vocabulary.length !== 703) fail(`核心詞彙應為 703，目前為 ${vocabulary.length}`);

const vocabularyIds = new Set();
for (const word of vocabulary) {
	if (!word.id || !word.word || !word.reading || !word.meaning) fail(`詞彙欄位不完整：${JSON.stringify(word)}`);
	if (vocabularyIds.has(word.id)) fail(`重複 vocabulary id：${word.id}`);
	vocabularyIds.add(word.id);
}

const introduced = new Set();
const legacyFields = ['grammarQuestion', 'exampleZh', 'reading', 'listening', 'stage', 'stageName', 'quizCount', 'furiganaGuide', 'reviewDay'];

for (let index = 0; index < lessons.length; index += 1) {
	const lesson = lessons[index];
	const expectedDay = index + 1;
	if (lesson.day !== expectedDay) fail(`Day 不連續：預期 ${expectedDay}，實際 ${lesson.day}`);

	for (const field of legacyFields) {
		if (field in lesson) fail(`Day ${lesson.day} 仍包含舊欄位：${field}`);
	}

	if (!lesson.title || !lesson.pattern || !lesson.canDo || !lesson.explanation) fail(`Day ${lesson.day} 教材基本欄位不完整`);
	if (!Array.isArray(lesson.examples) || !lesson.examples.length) fail(`Day ${lesson.day} 沒有例句`);
	for (const example of lesson.examples || []) {
		if (!example.jp || !example.zh) fail(`Day ${lesson.day} 例句缺日文或中文：${JSON.stringify(example)}`);
	}

	const plan = vocabularyPlan[lesson.day];
	if (!plan) fail(`Day ${lesson.day} 缺 vocabulary plan`);
	const ids = [...(plan?.new || []), ...(plan?.review || [])];
	if (ids.length !== 20) fail(`Day ${lesson.day} 應有 20 張單字，目前 ${ids.length}`);
	if (new Set(ids).size !== ids.length) fail(`Day ${lesson.day} 單字計畫有重複 id`);

	for (const id of plan?.new || []) {
		if (!vocabularyIds.has(id)) fail(`Day ${lesson.day} new 使用不存在 id：${id}`);
		if (introduced.has(id)) fail(`Day ${lesson.day} 重複把 ${id} 標成 new`);
		introduced.add(id);
	}
	for (const id of plan?.review || []) {
		if (!vocabularyIds.has(id)) fail(`Day ${lesson.day} review 使用不存在 id：${id}`);
		if (!introduced.has(id)) fail(`Day ${lesson.day} 在首次介紹前就 review：${id}`);
	}

	if (lesson.check) {
		const { q, options, answer } = lesson.check;
		if (!q || !Array.isArray(options) || options.length < 2) fail(`Day ${lesson.day} check 格式錯誤`);
		if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) fail(`Day ${lesson.day} check answer 超出範圍`);
		if (new Set(options).size !== options.length) fail(`Day ${lesson.day} check 選項重複`);
		if (options.some((option) => /ですです|ますます。/.test(option))) fail(`Day ${lesson.day} 出現機械式錯誤干擾項`);
	}

	if (lesson.day < 91 && lesson.exam) fail(`Day ${lesson.day} 不應提前放正式模擬資料`);
	if (lesson.day >= 91) {
		if (!lesson.exam) fail(`Day ${lesson.day} 缺模擬資料`);
		const readings = lesson.exam?.readings || [];
		const listenings = lesson.exam?.listenings || [];
		if (!readings.length || !listenings.length) fail(`Day ${lesson.day} 應同時有讀解與聽解素材`);
		for (const [kind, items] of [['reading', readings], ['listening', listenings]]) {
			for (const item of items) {
				const text = item.text;
				if (!text || !item.q || !Array.isArray(item.options) || item.options.length !== 4) fail(`Day ${lesson.day} ${kind} 格式不完整`);
				if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) fail(`Day ${lesson.day} ${kind} answer 超出範圍`);
				if (new Set(item.options).size !== item.options.length) fail(`Day ${lesson.day} ${kind} 選項重複`);
				if (!item.zh) fail(`Day ${lesson.day} ${kind} 缺中文解析`);
			}
		}
	}
}

if (introduced.size !== vocabulary.length) {
	fail(`最終應介紹全部 ${vocabulary.length} 個詞彙，目前 new 共 ${introduced.size}`);
}

if (errors.length) {
	console.error(`\n教材驗證失敗：${errors.length} 項\n`);
	errors.forEach((message) => console.error(`- ${message}`));
	process.exit(1);
}

console.log('教材資料驗證通過');
console.log(`- 課程：${lessons.length} 天`);
console.log(`- 核心詞彙：${vocabulary.length} 個`);
console.log(`- 每日單字計畫：20 張 × ${lessons.length} 天`);
console.log(`- 模擬素材：Day 91–100`);
if (warn.length) warn.forEach((message) => console.warn(`- ${message}`));