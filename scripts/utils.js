export function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function todayKey() {
	return new Date().toISOString().slice(0, 10);
}

export function showToast(message) {
	const toast = document.createElement('div');
	toast.className = 'toast show position-fixed start-50 translate-middle-x text-bg-dark border-0';
	toast.style.cssText = 'z-index:2000;bottom:92px';
	toast.innerHTML = `<div class="toast-body px-3 py-2">${escapeHtml(message)}</div>`;
	document.body.append(toast);
	window.setTimeout(() => toast.remove(), 1800);
}

export function seededShuffle(items, seed = 1) {
	const output = [...items];
	let value = seed;
	const random = () => {
		value = (value * 9301 + 49297) % 233280;
		return value / 233280;
	};
	for (let index = output.length - 1; index > 0; index -= 1) {
		const target = Math.floor(random() * (index + 1));
		[output[index], output[target]] = [output[target], output[index]];
	}
	return output;
}