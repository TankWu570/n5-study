import { showToast } from './utils.js';

export function getJapaneseVoices() {
	if (!('speechSynthesis' in window)) return [];
	return speechSynthesis.getVoices().filter((voice) => /^ja/i.test(voice.lang));
}

export function speakJapanese(text, state) {
	if (!('speechSynthesis' in window)) {
		showToast('此瀏覽器不支援日文朗讀');
		return;
	}

	speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(String(text).replace(/【.*?】/g, ''));
	utterance.lang = 'ja-JP';
	utterance.rate = Number(state.speechRate || 0.85);
	utterance.volume = Number(state.speechVolume ?? 1);

	const voices = getJapaneseVoices();
	const selected = voices.find((voice) => voice.name === state.speechVoice) || voices[0];
	if (selected) utterance.voice = selected;
	speechSynthesis.speak(utterance);
}