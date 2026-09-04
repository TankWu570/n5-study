import { curriculum } from './curriculum.js';
import { vocabulary } from './vocabulary.js';
import { vocabularyPlan } from './vocabulary-plan.js';
import { lessons01To20 } from './lessons/01-20.js';
import { lessons21To40 } from './lessons/21-40.js';
import { lessons41To60 } from './lessons/41-60.js';
import { lessons61To80 } from './lessons/61-80.js';
import { lessons81To100 } from './lessons/81-100.js';

const vocabularyById = new Map(vocabulary.map((word) => [word.id, word]));
const rawLessons = [
	...lessons01To20,
	...lessons21To40,
	...lessons41To60,
	...lessons61To80,
	...lessons81To100
];

function plannedWords(day) {
	const plan = vocabularyPlan[day] || { new: [], review: [] };
	const expand = (ids, kind) => ids.map((id) => {
		const word = vocabularyById.get(id);
		if (!word) throw new Error(`Unknown vocabulary id: ${id}`);
		return { ...word, kind };
	});
	return [...expand(plan.new, 'new'), ...expand(plan.review, 'review')];
}

export const lessons = rawLessons.map((lesson) => ({
	...lesson,
	vocabulary: plannedWords(lesson.day)
}));

export { curriculum, vocabulary, vocabularyPlan };