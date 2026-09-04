export const curriculum = {
	"method": "以 JLPT N5 官方能力與題型框架為考試終點，並參考 GENKI I、IRODORI Starter A1 與 Marugoto Starter A1 校準初級學習順序與生活情境。網站內例句、練習與中文解說為本站整理。",
	"dailyVocab": "每天約 20 張：Day 1 先建立 20 個基礎核心字；Day 2–69 原則為 10 新 + 10 間隔複習；Day 70 收完核心字後，Day 71–100 以弱點與舊字回收為主。",
	"quiz": "測驗採漸進式：前期 8 題起，後期逐步增加到 N5 題型混合與模擬；題目只取用當天以前已教過的內容。",
	"sources": [
		{
			"name": "JLPT 官方：N5 能力要求",
			"url": "https://www.jlpt.jp/e/about/levelsummary.html",
			"note": "N5 目標是理解部分基礎日語；可理解以基本語彙、漢字寫成的典型句子，並能從慢速的日常／課堂短對話抓取必要資訊。"
		},
		{
			"name": "JLPT 官方：N5 科目與題型",
			"url": "https://www.jlpt.jp/e/guideline/testsections.html",
			"note": "用於後期文字語彙、文法、讀解、資訊檢索與聽解題型的設計。"
		},
		{
			"name": "JLPT 官方 FAQ：不公布固定字表",
			"url": "https://www.jlpt.jp/e/faq/",
			"note": "2010 改制後不再公布固定的單字、漢字與文法清單；因此本站用能力與題型框架校準，而不是宣稱某份清單是官方字表。"
		},
		{
			"name": "GENKI 3rd Edition",
			"url": "https://genki3.japantimes.co.jp/en/intro/index.html",
			"note": "GENKI 官方說明 Vol.1 Lessons 1–12 完成後約對應 JLPT N5 / CEFR A1；用於初級文法與四技能學習順序校準。"
		},
		{
			"name": "IRODORI Starter (A1)",
			"url": "https://www.irodori.jpf.go.jp/en/starter/pdf.html",
			"note": "日本國際交流基金教材，以 Can-do 與生活情境為中心，用於自我介紹、日常生活、購物、交通等情境安排。"
		},
		{
			"name": "Marugoto Starter (A1)",
			"url": "https://marugoto.jpf.go.jp/en/teacher/feature/",
			"note": "日本國際交流基金 A1 教材；用於溝通情境、最基本句型與漸進式聽說讀寫安排。"
		}
	],
	"stages": [
		{
			"id": "foundation",
			"from": 1,
			"to": 10,
			"name": "基礎建立",
			"short": "文法・單字・例句",
			"quizCount": 8,
			"description": "先建立最基本句型與語彙。沒有正式讀解或聽解測驗，只有例句發音與句型練習。"
		},
		{
			"id": "sentence",
			"from": 11,
			"to": 20,
			"name": "句子建立",
			"short": "基礎句型＋聽句辨意",
			"quizCount": 10,
			"description": "開始辨認時間、日期與動詞句。加入單句聽辨，但仍不要求處理完整對話。"
		},
		{
			"id": "micro",
			"from": 21,
			"to": 30,
			"name": "短句理解",
			"short": "超短閱讀＋短句聽辨",
			"quizCount": 12,
			"description": "助詞與日常動作建立後，才加入 1–2 句的超短閱讀與短句聽辨。"
		},
		{
			"id": "integrated",
			"from": 31,
			"to": 50,
			"name": "初級整合",
			"short": "短文・短對話",
			"quizCount": 14,
			"description": "可以處理存在、形容詞與數量後，開始 3–4 句短文與短對話。"
		},
		{
			"id": "jlpt_intro",
			"from": 51,
			"to": 70,
			"name": "N5 題型導入",
			"short": "讀解・聽解入門",
			"quizCount": 15,
			"description": "て形、邀請、願望等核心句型建立後，逐步引入 JLPT N5 類型的閱讀與聽解。"
		},
		{
			"id": "exam",
			"from": 71,
			"to": 90,
			"name": "N5 考試訓練",
			"short": "題型混合",
			"quizCount": 20,
			"description": "普通形與整合句型完成後，增加語序、篇章、資訊理解與聽解題型比例。"
		},
		{
			"id": "mock",
			"from": 91,
			"to": 99,
			"name": "模擬衝刺",
			"short": "模擬題組",
			"quizCount": 24,
			"description": "接近正式 N5 題型，降低振假名與中文提示，集中練習讀解、聽解與綜合題型。"
		},
		{
			"id": "final",
			"from": 100,
			"to": 100,
			"name": "Day 100 綜合模擬",
			"short": "綜合模擬",
			"quizCount": 30,
			"description": "最後一天做綜合模擬與弱點整理。"
		}
	],
	"namePolicy": "人名消歧：日本姓名只使用讀音明確、教材中明示振假名的例子；台灣／華人姓名在日文句子中以片假名表記，不把中文姓氏直接套成日本姓氏讀法。"
};