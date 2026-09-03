import { curriculum, lessons, vocabulary } from '../data/index.js';
import { escapeHtml, seededShuffle } from './utils.js';
import { renderJapanese, renderExerciseJapanese } from './japanese.js';
import { getJapaneseVoices } from './speech.js';
import { buildListeningPractice, buildReadingPractice, generateQuiz } from './quiz.js';

export const wordKey = (word) => `${word.word}|${word.reading}`;

export function lessonForDay(day) {
	return lessons[day - 1];
}

export function stageForDay(day) {
	return curriculum.stages.find((stage) => stage.from <= day && day <= stage.to);
}

export function partsForDay(state, day) {
	return { grammar: false, vocab: false, practice: false, quiz: false, ...(state.parts[day] || {}) };
}

export function streak(state) {
	const dates = new Set(state.studyDates);
	const cursor = new Date();
	let count = 0;
	while (dates.has(cursor.toISOString().slice(0, 10))) {
		count += 1;
		cursor.setDate(cursor.getDate() - 1);
	}
	return count;
}

function stageBadge(stage) {
	return `<span class="stage-badge">${escapeHtml(stage.name)}</span>`;
}

function supportBadge(lesson) {
	return `<span class="support-badge"><i class="bi bi-spellcheck"></i> ${escapeHtml(lesson.furiganaGuide)}</span>`;
}

function practiceLabel(stage) {
	const labels = {
		foundation: '句型練習', sentence: '句型＋聽句', micro: '短句理解', integrated: '短文＋短對話',
		jlpt_intro: 'N5 讀聽入門', exam: 'N5 題型練習', mock: '模擬題組', final: '模擬題組'
	};
	return labels[stage.id] || '今日練習';
}

export function renderWordCard(word, day, state) {
	const key = wordKey(word);
	const level = state.vocab[key] || 0;
	return `<article class="word-card">
    <div class="d-flex justify-content-between gap-3">
      <div class="flex-grow-1">
        <div class="d-flex align-items-center flex-wrap gap-2">
          <span class="word-main">${renderJapanese(word.word, day, state)}</span>
          ${word.kind ? `<span class="badge rounded-pill ${word.kind === 'new' ? 'badge-new' : 'badge-review-word'}">${word.kind === 'new' ? '新' : '複習'}</span>` : ''}
        </div>
        <div class="word-reading">${escapeHtml(word.reading)}</div>
        <div class="word-meaning">${escapeHtml(word.meaning)}</div>
        <div class="btn-group btn-group-sm familiar mt-2" data-word-key="${escapeHtml(key)}">
          <button class="btn btn-outline-secondary ${level === 0 ? 'active' : ''}" data-familiarity="0">不熟</button>
          <button class="btn btn-outline-secondary ${level === 1 ? 'active' : ''}" data-familiarity="1">有印象</button>
          <button class="btn btn-outline-secondary ${level === 2 ? 'active' : ''}" data-familiarity="2">熟悉</button>
        </div>
      </div>
      <button class="btn btn-light speak-btn" aria-label="播放 ${escapeHtml(word.word)}" data-speak="${escapeHtml(word.reading)}"><i class="bi bi-volume-up"></i></button>
    </div>
  </article>`;
}

export function renderHome(state) {
	const lesson = lessonForDay(state.currentDay);
	const stage = stageForDay(state.currentDay);
	const parts = partsForDay(state, lesson.day);
	const stats = [
		['bi-check2-circle', '完成天數', state.completedDays.length, '天'],
		['bi-fire', '連續學習', streak(state), '天'],
		['bi-stars', '熟悉單字', Object.values(state.vocab).filter((value) => value >= 2).length, '個'],
		['bi-clipboard2-check', '測驗紀錄', state.quizHistory.length, '次']
	];

	return `<section class="hero mb-4">
      <div class="hero-art hero-art-one"></div><div class="hero-art hero-art-two"></div>
      <div class="row align-items-center g-4 position-relative z-1">
        <div class="col-lg-8">
          <div class="d-flex align-items-center flex-wrap gap-2 mb-3">${stageBadge(stage)}<span class="hero-support">${escapeHtml(stage.short)}</span></div>
          <div class="eyebrow mb-2">TODAY'S JAPANESE</div>
          <div class="hero-day">Day ${state.currentDay}<span>/ 100</span></div>
          <h1 class="hero-lesson-title mt-3 mb-2">${escapeHtml(lesson.title)}</h1>
          <div class="hero-pattern">${escapeHtml(lesson.pattern)}</div>
          <div class="hero-progress mt-4">
            <div class="d-flex justify-content-between small mb-2"><span>100 天進度</span><b>${state.completedDays.length}%</b></div>
            <div class="progress"><div class="progress-bar" style="width:${state.completedDays.length}%"></div></div>
          </div>
          <div class="d-flex flex-wrap gap-2 mt-4">
            <button class="btn btn-light btn-lg hero-start fw-bold" id="start-today-button"><i class="bi bi-play-fill me-1"></i>開始今天的學習</button>
            <button class="btn hero-secondary" id="open-progress-button"><i class="bi bi-calendar3 me-1"></i>100 天路線</button>
          </div>
        </div>
        <div class="col-lg-4 d-none d-lg-block"><div class="hero-day-card"><div class="hero-day-card-label">CURRENT</div><div class="hero-day-card-number">${String(state.currentDay).padStart(2, '0')}</div><div class="hero-day-card-jp">日本語</div></div></div>
      </div>
    </section>
    <div class="row g-3 mb-4">${stats.map((item) => `<div class="col-6 col-lg-3"><article class="app-card stat-card p-3 p-md-4 h-100"><div class="stat-icon"><i class="bi ${item[0]}"></i></div><div class="stat-number mt-3">${item[2]}<small>${item[3]}</small></div><div class="stat-label">${item[1]}</div></article></div>`).join('')}</div>
    <div class="row g-3 g-lg-4">
      <div class="col-lg-8"><section class="app-card today-card p-3 p-md-4 h-100">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-3"><div><div class="section-kicker">TODAY PLAN</div><h2 class="h3 section-title mt-1 mb-1">${escapeHtml(lesson.title)}</h2><p class="text-body-secondary mb-0">${escapeHtml(lesson.canDo)}</p></div><div class="d-none d-sm-block">${supportBadge(lesson)}</div></div>
        <div class="progress-steps">${[
			['bi-book', '文法與句型', parts.grammar], ['bi-translate', '20 張單字', parts.vocab], ['bi-pencil-square', practiceLabel(stage), parts.practice], ['bi-patch-check', `${stage.quizCount} 題測驗`, parts.quiz]
		].map((item, index) => `<div class="progress-step ${item[2] ? 'done' : ''}"><span class="step-icon"><i class="bi ${item[0]}"></i></span><div class="flex-grow-1"><small>STEP ${index + 1}</small><b>${item[1]}</b></div><span class="step-state">${item[2] ? '<i class="bi bi-check-lg"></i>' : index + 1}</span></div>`).join('')}</div>
        <button class="btn btn-primary btn-lg w-100 mt-3 fw-bold" id="open-today-lesson-button">進入 Day ${state.currentDay} 教材 <i class="bi bi-arrow-right ms-1"></i></button>
      </section></div>
      <div class="col-lg-4"><aside class="app-card stage-panel p-3 p-md-4 h-100"><div class="section-kicker">LEARNING STAGE</div><h2 class="h4 fw-bold mt-2">${escapeHtml(stage.name)}</h2><div class="stage-days">DAY ${stage.from} — ${stage.to}</div><p class="text-body-secondary mt-3">${escapeHtml(stage.description)}</p><div class="stage-mini-rule"><i class="bi bi-lightbulb"></i><span>教材有振假名；每日練習與測驗不顯示振假名。</span></div><button class="btn btn-soft w-100 mt-3" id="open-settings-button"><i class="bi bi-sliders me-1"></i>學習設定</button></aside></div>
    </div>`;
}

function previousTranslations(day, count) {
	const pool = [];
	for (let index = Math.max(1, day - 12); index <= day; index += 1) {
		for (const translation of lessons[index - 1].exampleZh || []) if (translation) pool.push(translation);
	}
	return seededShuffle([...new Set(pool)], day * 71).slice(0, count);
}

function choiceButtons(options, answer, className, day) {
	const correct = options[answer];
	const unique = [correct, ...options.filter((item, index) => index !== answer && item !== correct)];
	const shuffled = seededShuffle([...new Set(unique)], day * 101 + className.length).slice(0, 4);
	const answerIndex = shuffled.indexOf(correct);
	return `<div class="d-grid gap-2 choice-group" data-answer="${answerIndex}">${shuffled.map((item, index) => `<button class="practice-option ${className}" data-choice="${index}">${escapeHtml(item)}</button>`).join('')}</div>`;
}

function readingBlock(lesson, day, exam) {
	const reading = exam ? lesson.reading : buildReadingPractice(lesson, day);
	return `<div class="practice-block"><div class="mini-label">閱讀</div><div class="reading-box p-3"><div class="jp-text exercise-jp">${renderExerciseJapanese(reading.text)}</div><div class="fw-semibold mt-3">${renderExerciseJapanese(reading.q)}</div><div class="d-grid gap-2 mt-2 choice-group" data-answer="${reading.answer}">${reading.options.map((option, index) => `<button class="practice-option reading-choice" data-choice="${index}">${renderExerciseJapanese(option)}</button>`).join('')}</div><div class="practice-feedback mt-2" data-translation="${escapeHtml(reading.zh)}"></div></div></div>`;
}

function listeningBlock(lesson, day, exam) {
	const listening = exam ? { audio: lesson.listening.text, q: lesson.listening.q, options: lesson.listening.options, answer: lesson.listening.answer, zh: lesson.listening.zh } : buildListeningPractice(lesson, day);
	return `<div class="practice-block mt-3"><div class="mini-label">聽解</div><div class="listening-panel p-3"><button class="btn listen-btn mb-3" data-speak="${escapeHtml(listening.audio)}"><i class="bi bi-volume-up-fill"></i><span>播放內容</span></button><div class="fw-semibold">${renderExerciseJapanese(listening.q)}</div><div class="d-grid gap-2 mt-2 choice-group" data-answer="${listening.answer}">${listening.options.map((option, index) => `<button class="practice-option listening-choice" data-choice="${index}">${renderExerciseJapanese(option)}</button>`).join('')}</div><div class="practice-feedback mt-2" data-translation="${escapeHtml(listening.zh)}"></div></div></div>`;
}

function renderPractice(lesson, stage, parts, day) {
	const done = parts.practice;
	if (stage.id === 'foundation') {
		return `<div class="small text-body-secondary">03 基礎練習</div><h2 class="h4 section-title">先把句型用對</h2><div class="stage-note mb-3"><b>Day 1–10 不做正式讀解／聽解。</b><br><span>先看懂句型、能念例句、認得今天的單字，避免一開始負荷過高。</span></div><div class="mini-practice"><div class="mini-label">看日文選中文</div><div class="jp-text exercise-jp mb-2">${renderExerciseJapanese(lesson.examples[0])}</div>${choiceButtons([lesson.exampleZh[0], ...previousTranslations(day, 3)], 0, 'practice-choice', day)}</div><button class="btn ${done ? 'btn-success' : 'btn-outline-primary'} w-100 mt-3 fw-bold" id="complete-practice-button">${done ? '✓ 基礎練習完成' : '確認答案並完成'}</button>`;
	}
	if (stage.id === 'sentence') {
		return `<div class="small text-body-secondary">03 句子建立</div><h2 class="h4 section-title">句型＋單句聽辨</h2><div class="stage-note mb-3">現在才加入<strong>單句</strong>聽辨，仍然不要求完整對話或長篇閱讀。</div><div class="mini-practice mb-3"><div class="mini-label">句子理解</div><div class="jp-text exercise-jp mb-2">${renderExerciseJapanese(lesson.examples[1])}</div>${choiceButtons([lesson.exampleZh[1], ...previousTranslations(day, 3)], 0, 'practice-choice', day)}</div><div class="listening-mini"><div class="mini-label">聽一句，選意思</div><button class="btn listen-btn mb-2" data-speak="${escapeHtml(lesson.examples[0])}"><i class="bi bi-volume-up-fill"></i> 播放一句</button>${choiceButtons([lesson.exampleZh[0], ...previousTranslations(day, 3)], 0, 'listen-choice', day)}</div><button class="btn ${done ? 'btn-success' : 'btn-outline-primary'} w-100 mt-3 fw-bold" id="complete-practice-button">${done ? '✓ 今日練習完成' : '確認答案並完成'}</button>`;
	}
	if (stage.id === 'micro') {
		const text = `${lesson.examples[0]} ${lesson.examples[1]}`;
		return `<div class="small text-body-secondary">03 短句理解</div><h2 class="h4 section-title">超短閱讀＋短句聽辨</h2><p class="small text-body-secondary">只用今天以前已學句型，閱讀先控制在 1–2 句。</p><div class="reading-box p-3 mb-3"><div class="jp-text exercise-jp">${renderExerciseJapanese(text)}</div><div class="mt-3 fw-semibold">第二句的意思是？</div>${choiceButtons([lesson.exampleZh[1], ...previousTranslations(day, 3)], 0, 'practice-choice', day)}</div><div class="listening-mini"><div class="mini-label">聽第一句</div><button class="btn listen-btn mb-2" data-speak="${escapeHtml(lesson.examples[0])}"><i class="bi bi-volume-up-fill"></i> 播放</button>${choiceButtons([lesson.exampleZh[0], ...previousTranslations(day, 3)], 0, 'listen-choice', day)}</div><button class="btn ${done ? 'btn-success' : 'btn-outline-primary'} w-100 mt-3 fw-bold" id="complete-practice-button">${done ? '✓ 短句理解完成' : '確認答案並完成'}</button>`;
	}
	if (stage.id === 'integrated') {
		return `<div class="small text-body-secondary">03 初級整合</div><h2 class="h4 section-title">短文＋短對話</h2><p class="small text-body-secondary">從 Day 31 開始才正式練 3–4 句短文；答完再看中文。</p>${readingBlock(lesson, day, false)}${listeningBlock(lesson, day, false)}<button class="btn ${done ? 'btn-success' : 'btn-outline-primary'} w-100 mt-3 fw-bold" id="complete-practice-button">${done ? '✓ 整合練習完成' : '完成閱讀與聽辨'}</button>`;
	}
	if (stage.id === 'jlpt_intro') {
		return `<div class="small text-body-secondary">03 N5 題型導入</div><h2 class="h4 section-title">讀解・聽解入門</h2><p class="small text-body-secondary">開始靠近 JLPT。練習題不顯示振假名，答題後提供中文解析。</p>${readingBlock(lesson, day, false)}${listeningBlock(lesson, day, false)}<button class="btn ${done ? 'btn-success' : 'btn-outline-primary'} w-100 mt-3 fw-bold" id="complete-practice-button">${done ? '✓ N5 入門練習完成' : '完成 N5 入門練習'}</button>`;
	}
	const isMock = stage.id === 'mock' || stage.id === 'final';
	return `<div class="small text-body-secondary">03 ${isMock ? '模擬題組' : 'N5 題型訓練'}</div><h2 class="h4 section-title">${isMock ? '降低提示，接近考試' : '讀解・聽解混合'}</h2><p class="small text-body-secondary">${isMock ? '練習題固定不顯示振假名；模擬階段進一步降低其他提示。' : '普通形與核心句型建立後，開始處理更完整的 N5 題型。'}</p>${readingBlock(lesson, day, isMock)}${listeningBlock(lesson, day, isMock)}<button class="btn ${done ? 'btn-success' : 'btn-outline-primary'} w-100 mt-3 fw-bold" id="complete-practice-button">${done ? '✓ 題型練習完成' : '完成今日題型練習'}</button>`;
}

export function renderLesson(day, state) {
	const lesson = lessonForDay(day);
	const stage = stageForDay(day);
	const parts = partsForDay(state, day);
	const newCount = lesson.vocabulary.filter((word) => word.kind === 'new').length;
	return `<div class="lesson-toolbar mb-3"><button class="lesson-nav-btn" id="previous-day-button" aria-label="上一天"><i class="bi bi-chevron-left"></i></button><div class="text-center">${stageBadge(stage)}<div class="lesson-day-label mt-1">DAY ${day} / 100</div></div><button class="lesson-nav-btn" id="next-day-button" aria-label="下一天"><i class="bi bi-chevron-right"></i></button></div>
    <header class="lesson-head app-card lesson-banner p-3 p-md-4 mb-3 mb-lg-4"><div class="section-kicker">MODULE ${lesson.module} · ${escapeHtml(lesson.phase)}</div><h1 class="lesson-mobile-title fw-bold mt-2 mb-2">${escapeHtml(lesson.title)}</h1><div class="lesson-pattern-preview">${escapeHtml(lesson.pattern)}</div><div class="d-flex gap-2 flex-wrap mt-3">${supportBadge(lesson)}<span class="support-badge"><i class="bi bi-pencil-square"></i> 練習不顯示振假名</span><span class="support-badge"><i class="bi bi-ui-checks"></i> ${stage.quizCount} 題測驗</span></div><div class="learning-goal mt-3"><span class="goal-icon"><i class="bi bi-bullseye"></i></span><div><small>今天學完要會</small><b>${escapeHtml(lesson.canDo)}</b></div></div></header>
    <div class="row g-3 g-lg-4"><div class="col-lg-7">
      <section class="app-card lesson-section grammar-section p-3 p-md-4 mb-3 mb-lg-4"><div class="d-flex justify-content-between"><h2 class="h4 section-title"><span class="section-number">01</span> 文法與句型</h2>${parts.grammar ? '<span class="text-success fw-bold">✓</span>' : ''}</div><div class="pattern-box p-3 my-3"><div class="small text-body-secondary mb-1">TODAY'S PATTERN</div><div class="pattern-text">${renderJapanese(lesson.pattern, day, state)}</div></div><p class="mb-3">${escapeHtml(lesson.explanation)}</p><div class="grammar-note p-3 mb-3"><div class="fw-bold mb-2"><i class="bi bi-lightbulb me-1"></i>中文重點</div><ul class="mb-0 ps-3">${lesson.notes.map((note) => `<li class="mb-2">${escapeHtml(note)}</li>`).join('')}</ul></div><div class="fw-bold mb-1">例句</div>${lesson.examples.map((example, index) => `<div class="example-row d-flex justify-content-between gap-3"><div><div class="jp-text">${renderJapanese(example, day, state)}</div><div class="example-zh">${escapeHtml(lesson.exampleZh?.[index] || '')}</div></div><button class="btn btn-light speak-btn" data-speak="${escapeHtml(example)}"><i class="bi bi-volume-up"></i></button></div>`).join('')}<button class="btn ${parts.grammar ? 'btn-success' : 'btn-primary'} w-100 mt-2 fw-bold" id="complete-grammar-button">${parts.grammar ? '✓ 文法已完成' : '完成文法學習'}</button></section>
      <section class="app-card lesson-section vocab-section p-3 p-md-4 mb-3 mb-lg-4"><div class="d-flex justify-content-between align-items-center"><h2 class="h4 section-title mb-0"><span class="section-number">02</span> 今日單字</h2><span class="small text-body-secondary">新 ${newCount} · 複習 ${20 - newCount}</span></div><p class="small text-body-secondary mt-2 mb-0">每天約 20 張，前段以新字與間隔複習混合，後段逐步提高複習比重。</p><div class="mt-1">${lesson.vocabulary.map((word) => renderWordCard(word, day, state)).join('')}</div><button class="btn ${parts.vocab ? 'btn-success' : 'btn-primary'} w-100 mt-3 fw-bold" id="complete-vocabulary-button">${parts.vocab ? '✓ 單字已完成' : '完成今日 20 張'}</button></section>
    </div><div class="col-lg-5"><section class="app-card lesson-section practice-section p-3 p-md-4 mb-3 mb-lg-4">${renderPractice(lesson, stage, parts, day)}</section><section class="app-card p-3 p-md-4 mb-3 mb-lg-4"><div class="d-flex justify-content-between align-items-start gap-3"><div><div class="section-kicker">04 · TODAY CHECK</div><h2 class="h4 section-title mb-1">${stage.quizCount} 題測驗</h2></div><span class="badge badge-soft">通過 ${Math.ceil(stage.quizCount * 0.75)} 題</span></div><p class="small text-body-secondary">題庫只取用 Day 1～${day} 已學內容，練習與測驗不提供振假名。</p><button class="btn ${parts.quiz ? 'btn-success' : 'btn-primary'} w-100 fw-bold" id="open-quiz-button">${parts.quiz ? '✓ 已通過 · 再做一次' : '開始今日測驗'}</button></section></div></div>`;
}

export function renderQuiz(day, state) {
	const lesson = lessonForDay(day);
	const stage = stageForDay(day);
	const questions = generateQuiz(lesson, stage);
	const pass = Math.ceil(questions.length * 0.75);
	return { questions, html: `<div class="row justify-content-center"><div class="col-xl-8 col-lg-9"><div class="quiz-topbar mb-4"><button class="lesson-nav-btn" id="back-to-lesson-button"><i class="bi bi-arrow-left"></i></button><div class="flex-grow-1"><div class="section-kicker">DAY ${day} · DAILY CHECK</div><h1 class="h2 fw-bold mb-1">今日測驗</h1><div class="small text-body-secondary">題目不顯示振假名 · 只考 Day 1–${day} 已學內容</div></div><div class="quiz-count"><b>${questions.length}</b><small>題</small></div></div><div class="quiz-rule mb-3"><i class="bi bi-eye-slash"></i><span>送出答案後會顯示中文解析與必要讀音。</span><b>${pass} 題通過</b></div>${questions.map((question, index) => `<article class="app-card quiz-card p-3 p-md-4 mb-3 quiz-q" data-question-index="${index}"><div class="quiz-card-head"><span>${String(index + 1).padStart(2, '0')}</span><b>${escapeHtml(question.type)}</b></div>${question.passage ? `<div class="reading-box p-3 mb-3 jp-text exercise-jp">${renderExerciseJapanese(question.passage)}</div>` : ''}<div class="fw-semibold mb-3 quiz-question">${renderExerciseJapanese(question.q)}</div>${question.audio ? `<button class="btn listen-btn mb-3" data-speak="${escapeHtml(question.audio)}"><i class="bi bi-volume-up-fill"></i><span>播放題目</span></button>` : ''}<div class="d-grid gap-2">${question.options.map((option, optionIndex) => `<button class="quiz-option" data-question="${index}" data-option="${optionIndex}"><span class="option-letter">${String.fromCharCode(65 + optionIndex)}</span><span>${renderExerciseJapanese(option)}</span></button>`).join('')}</div><div class="quiz-feedback"></div></article>`).join('')}<div class="submit-sticky"><button class="btn btn-primary btn-lg w-100 fw-bold" id="submit-quiz-button">送出 ${questions.length} 題答案</button></div></div></div>` };
}

export function renderVocabulary(state, filter) {
	const currentLesson = lessonForDay(state.currentDay);
	let list = filter === 'today' ? currentLesson.vocabulary : filter === 'weak' ? vocabulary.filter((word) => (state.vocab[wordKey(word)] || 0) < 2) : filter === 'known' ? vocabulary.filter((word) => (state.vocab[wordKey(word)] || 0) >= 2) : vocabulary;
	return `<div class="row justify-content-center"><div class="col-lg-8"><h1 class="display-6 fw-bold">單字</h1><p class="text-body-secondary">管理每日單字、發音與熟悉度。</p><div class="d-flex gap-2 overflow-auto pb-2">${[['today', '今日'], ['weak', '需要加強'], ['known', '已熟悉'], ['all', '全部']].map(([key, label]) => `<button class="btn btn-sm ${filter === key ? 'btn-dark' : 'btn-outline-secondary'} text-nowrap" data-vocabulary-filter="${key}">${label}</button>`).join('')}</div><input id="vocabulary-search" class="form-control my-3" placeholder="搜尋日文、假名或中文"><div class="app-card p-3 p-md-4" id="vocabulary-list">${list.map((word) => renderWordCard(word, state.currentDay, state)).join('') || '<div class="py-5 text-center text-body-secondary">目前沒有單字</div>'}</div></div></div>`;
}

export function renderReview(state) {
	const weak = vocabulary.filter((word) => (state.vocab[wordKey(word)] || 0) < 2).slice(0, 20);
	return `<div class="row g-4"><div class="col-lg-7"><h1 class="display-6 fw-bold">複習</h1><p class="text-body-secondary">優先回收不熟與有印象的單字。</p><div class="app-card p-3 p-md-4">${weak.map((word) => renderWordCard(word, state.currentDay, state)).join('') || '<div class="py-5 text-center text-body-secondary">目前沒有弱點單字</div>'}</div></div><div class="col-lg-5"><aside class="app-card p-3 p-md-4"><h2 class="h5 fw-bold">最近測驗</h2>${state.quizHistory.length ? state.quizHistory.slice(-10).reverse().map((item) => `<div class="d-flex justify-content-between border-top py-2"><span>Day ${item.day}</span><b>${item.score}/${item.total}</b></div>`).join('') : '<div class="text-body-secondary small">還沒有測驗紀錄。</div>'}</aside></div></div>`;
}

export function renderProgress(state) {
	return `<div class="d-flex justify-content-between align-items-end mb-3"><div><h1 class="display-6 fw-bold mb-1">100 天學習路線</h1><p class="text-body-secondary mb-0">從基礎句型逐步銜接 N5 題型。</p></div><b>${state.completedDays.length}%</b></div><div class="row g-3 mb-4">${curriculum.stages.map((stage) => `<div class="col-md-6 col-xl-4"><article class="app-card stage-route p-3 h-100"><div class="small text-body-secondary">DAY ${stage.from}–${stage.to}</div><h2 class="h5 fw-bold mt-1">${escapeHtml(stage.name)}</h2><p class="small mb-2">${escapeHtml(stage.description)}</p><span class="badge text-bg-light border">每日測驗 ${stage.quizCount} 題</span></article></div>`).join('')}</div><div class="day-grid mb-4">${lessons.map((lesson) => `<button class="day-btn ${state.completedDays.includes(lesson.day) ? 'done' : ''} ${lesson.day === state.currentDay ? 'current' : ''}" data-open-day="${lesson.day}" title="${escapeHtml(lesson.title)}">${lesson.day}</button>`).join('')}</div><div class="app-card p-3 p-md-4">${lessons.map((lesson) => `<div class="d-flex justify-content-between align-items-center gap-3 py-2 border-bottom"><div><b>Day ${lesson.day}</b><div class="small text-body-secondary">${escapeHtml(lesson.title)} · ${escapeHtml(lesson.stageName)}</div></div><button class="btn btn-sm btn-outline-secondary" data-open-day="${lesson.day}">開啟</button></div>`).join('')}</div>`;
}

export function renderSources() {
	return `<div class="row justify-content-center"><div class="col-lg-9"><h1 class="display-6 fw-bold">教材設計與參考</h1><p class="lead">以 JLPT N5 的能力要求作為終點，再用初級教材校準學習順序與生活情境。</p><div class="alert alert-warning"><b>JLPT 並未公布固定的 N5 單字、漢字與文法清單。</b>本站不宣稱任何單一字表是官方清單。</div><div class="row g-3">${curriculum.sources.map((source) => `<div class="col-md-6"><article class="app-card source-card p-4 h-100"><h2 class="h5 fw-bold">${escapeHtml(source.name)}</h2><p class="small text-body-secondary">${escapeHtml(source.note)}</p><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">查看來源</a></article></div>`).join('')}</div></div></div>`;
}

export function renderSettings(state) {
	const voices = getJapaneseVoices();
	return `<div class="row justify-content-center"><div class="col-lg-8"><h1 class="display-6 fw-bold">設定</h1><p class="text-body-secondary">調整振假名、日文發音與學習資料。</p><div class="app-card p-3 p-md-4"><section class="setting-block"><h2 class="h5 fw-bold"><i class="bi bi-spellcheck me-1"></i>振假名</h2><p class="small text-body-secondary">只套用在教材、例句與單字；每日練習與測驗固定不顯示。</p><label class="form-label" for="furigana-policy">顯示規則</label><select id="furigana-policy" class="form-select mb-3"><option value="auto" ${state.furiganaPolicy === 'auto' ? 'selected' : ''}>自動（建議）</option><option value="all" ${state.furiganaPolicy === 'all' ? 'selected' : ''}>全部顯示</option><option value="off" ${state.furiganaPolicy === 'off' ? 'selected' : ''}>全部關閉</option></select><label class="form-label" for="furigana-style">顯示方式</label><select id="furigana-style" class="form-select"><option value="ruby" ${state.furiganaStyle === 'ruby' ? 'selected' : ''}>漢字上方（教科書式）</option><option value="paren" ${state.furiganaStyle === 'paren' ? 'selected' : ''}>漢字(かな)</option></select><div class="furi-preview mt-3">預覽：${renderJapanese('田中さんは会社員です。', 1, state)}</div></section><section class="setting-block"><h2 class="h5 fw-bold"><i class="bi bi-volume-up me-1"></i>日文發音</h2><label class="form-label mt-2" for="speech-voice">語音</label><select id="speech-voice" class="form-select mb-3"><option value="">自動選擇日文語音</option>${voices.map((voice) => `<option value="${escapeHtml(voice.name)}" ${state.speechVoice === voice.name ? 'selected' : ''}>${escapeHtml(voice.name)} · ${escapeHtml(voice.lang)}</option>`).join('')}</select><label class="form-label fw-semibold" for="speech-rate">速度 <span id="speech-rate-value">${state.speechRate}</span>x</label><input id="speech-rate" type="range" class="form-range" min=".6" max="1.15" step=".05" value="${state.speechRate}"><label class="form-label fw-semibold" for="speech-volume">音量 <span id="speech-volume-value">${Math.round((state.speechVolume ?? 1) * 100)}</span>%</label><input id="speech-volume" type="range" class="form-range" min="0" max="1" step=".1" value="${state.speechVolume ?? 1}"><button class="btn btn-outline-secondary" data-speak="田中さんは会社員です。"><i class="bi bi-play-fill"></i> 測試發音</button></section><section class="setting-block"><h2 class="h5 fw-bold"><i class="bi bi-database me-1"></i>學習資料</h2><p class="text-body-secondary small">進度存在目前瀏覽器。換裝置或清除網站資料前可先匯出。</p><div class="d-flex flex-wrap gap-2"><button id="export-data-button" class="btn btn-outline-primary">匯出備份</button><button id="import-data-button" class="btn btn-outline-primary">匯入備份</button><input id="import-data-file" type="file" accept="application/json,.json" hidden></div></section><section class="setting-block"><h2 class="h5 fw-bold">更多</h2><div class="d-grid gap-2 d-sm-flex"><button class="btn btn-outline-secondary" id="open-settings-progress-button">100 天路線</button><button class="btn btn-outline-secondary" id="open-sources-button">教材設計與參考</button></div></section><section class="setting-block"><h2 class="h5 fw-bold text-danger"><i class="bi bi-trash3 me-1"></i>清除資料</h2><p class="small text-body-secondary">會清除完成天數、單字熟悉度、測驗與連續學習，無法復原。</p><button id="reset-progress-button" class="btn btn-outline-danger">清除全部學習進度</button></section></div></div></div>`;
}