/* ==========================================================================
   Multi-Instance Audio Player Engine (Howler.js + HTML5 Canvas Waveform)
   ========================================================================== */

class AudioPlayerInstance {
	constructor(playerContainer) {
		this.container = playerContainer;

		// Find scoped elements within THIS specific player layout block
		this.playAudioElement = playerContainer.querySelector("audio");
		this.playPauseBtn = playerContainer.querySelector(".audio-button");
		this.currentTimeEl =
			playerContainer.parentElement.querySelector("#currentTime") ||
			playerContainer.querySelector(".time span:first-child");
		this.durationEl =
			playerContainer.parentElement.querySelector("#duration") ||
			playerContainer.querySelector(".time span:last-child");
		this.volumeSlider =
			playerContainer.querySelector('input[id^="volume"]') ||
			playerContainer.querySelector(".controls input:first-of-type");
		this.speedSlider =
			playerContainer.querySelector('input[id^="speed"]') ||
			playerContainer.querySelector(".controls input:last-of-type");
		this.canvas =
			playerContainer.parentElement.querySelector(".waveform-canvas") ||
			playerContainer.querySelector("canvas");

		if (!this.playAudioElement || !this.canvas) {
			console.warn(
				"Skipping player initialization: missing core components inside container.",
				playerContainer,
			);
			return;
		}

		this.ctx = this.canvas.getContext("2d");
		this.srcUrl = this.playAudioElement.src;
		this.peaks = [];
		this.progressInterval = null;
		this.sound = null;

		this.init();
	}

	init() {
		// Initialize dynamic Howler profile instance bound to scoped properties
		this.sound = new Howl({
			src: [this.srcUrl],
			html5: true,
			onplay: () => this.updateProgress(),
			onseek: () => this.updateProgress(),
			onload: () => {
				if (this.durationEl)
					this.durationEl.textContent = this.formatTime(this.sound.duration());
				if (this.peaks.length === 0) this.generateWaveform(this.srcUrl);
			},
		});

		// Set up local Event Bindings
		if (this.playPauseBtn) {
			this.playPauseBtn.addEventListener("click", () => this.togglePlay());
		}

		this.canvas.addEventListener("click", (e) => this.handleSeek(e));

		if (this.volumeSlider) {
			this.volumeSlider.addEventListener("input", () =>
				this.sound.volume(parseFloat(this.volumeSlider.value)),
			);
		}

		if (this.speedSlider) {
			this.speedSlider.addEventListener("input", () =>
				this.sound.rate(parseFloat(this.speedSlider.value)),
			);
		}

		// Window resize framework hook
		window.addEventListener("resize", () => this.resizeCanvas());
		this.showWaveformWhenVisible();
	}

	formatTime(secs) {
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60)
			.toString()
			.padStart(2, "0");
		return `${m}:${s}`;
	}

	resizeCanvas() {
		const rect = this.canvas.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;
		this.canvas.width = rect.width * window.devicePixelRatio * 0.8;
		this.canvas.height = rect.height * window.devicePixelRatio;
		this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		this.drawWaveform(
			this.sound ? this.sound.seek() / this.sound.duration() : 0,
		);
	}

	showWaveformWhenVisible() {
		const rect = this.canvas.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			this.resizeCanvas();
			if (this.peaks.length === 0) this.generateWaveform(this.srcUrl);
		} else {
			requestAnimationFrame(() => this.showWaveformWhenVisible());
		}
	}

	async generateWaveform(url) {
		try {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

			const rawData = audioBuffer.getChannelData(0);
			const samples = 200;
			const blockSize = Math.floor(rawData.length / samples);
			this.peaks = [];

			for (let i = 0; i < samples; i++) {
				let sum = 0;
				for (let j = 0; j < blockSize; j++) {
					sum += Math.abs(rawData[i * blockSize + j]);
				}
				this.peaks.push(sum / blockSize);
			}
			this.drawWaveform(0);
		} catch (err) {
			console.error(
				"Failed to extract waveform profile layers from audio file binary:",
				err,
			);
		}
	}

	getCssVariable(name) {
		return (
			getComputedStyle(document.documentElement)
				.getPropertyValue(name)
				.trim() || (name === "--waveform-foreground" ? "#ff0000" : "#cccccc")
		);
	}

	drawWaveform(progress = 0) {
		if (this.peaks.length === 0) return;
		const FOREGROUND_COLOR = this.getCssVariable("--waveform-foreground");
		const BACKGROUND_COLOR = this.getCssVariable("--waveform-background");
		const width = this.canvas.width / window.devicePixelRatio;
		const height = this.canvas.height / window.devicePixelRatio;

		this.ctx.clearRect(0, 0, width, height);

		const barWidth = width / this.peaks.length;
		const midY = height / 2;

		this.peaks.forEach((amp, i) => {
			const x = i * barWidth;
			const barHeight = amp * height * 0.9;
			const isPlayed = i / this.peaks.length < progress;
			this.ctx.fillStyle = isPlayed ? FOREGROUND_COLOR : BACKGROUND_COLOR;
			this.ctx.fillRect(x, midY - barHeight / 2, barWidth * 0.9, barHeight);
		});
	}

	togglePlay() {
		if (this.sound.playing()) {
			this.sound.pause();
			if (this.playPauseBtn) this.playPauseBtn.textContent = "▶️";
		} else {
			// Global pause intercept: Silences all other module engines active across page layers
			window.activeAudioPlayers.forEach((p) => {
				if (p !== this) p.pause();
			});
			this.sound.play();
			if (this.playPauseBtn) this.playPauseBtn.textContent = "⏸";
		}
	}

	pause() {
		if (this.sound && this.sound.playing()) {
			this.sound.pause();
			if (this.playPauseBtn) this.playPauseBtn.textContent = "▶️";
		}
	}

	stop() {
		if (this.sound) {
			this.sound.stop();
		}
		clearInterval(this.progressInterval);
		if (this.playPauseBtn) this.playPauseBtn.textContent = "▶️";
		if (this.currentTimeEl) this.currentTimeEl.textContent = "0:00";
		this.drawWaveform(0);
	}

	updateProgress() {
		clearInterval(this.progressInterval);
		this.progressInterval = setInterval(() => {
			if (!this.sound.playing()) {
				clearInterval(this.progressInterval);
				return;
			}
			const seek = this.sound.seek();
			const dur = this.sound.duration();
			const progress = seek / dur;

			if (this.currentTimeEl)
				this.currentTimeEl.textContent = this.formatTime(seek);
			this.drawWaveform(progress);
		}, 200);
	}

	handleSeek(e) {
		const rect = this.canvas.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const progress = clickX / rect.width;
		this.sound.seek(progress * this.sound.duration());
		this.drawWaveform(progress);
	}
}

// Global scope orchestration hooks
window.activeAudioPlayers = [];

document.addEventListener("DOMContentLoaded", () => {
	// Select all audio module configuration wrappers
	const internalLayouts = document.querySelectorAll(".audio-player");
	internalLayouts.forEach((layout) => {
		const structuralInstance = new AudioPlayerInstance(layout);
		window.activeAudioPlayers.push(structuralInstance);
	});
});

// Bridge function for modal closing intercept actions (onClick calls)
function stopAudioPlayer() {
	window.activeAudioPlayers.forEach((player) => player.stop());
}
