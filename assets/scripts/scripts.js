// Centralized configurations to make updating assets incredibly easy
const ASSETS = {
	playImg: "./assets/nav-images/play-g79150a13d_1280.png",
	stopImg: "./assets/nav-images/stop-g55029e04a_1280.png",
	hoverSound: "/assets/audio/computerwav-14702A.mp3",
};

/**
 * Core Helper: Pauses all audio tags except a specific one,
 * resetting play/stop icons across the page automatically.
 */
function resetOtherAudio(exceptionId = null) {
	document.querySelectorAll("audio").forEach((audio) => {
		if (audio.id !== exceptionId) {
			audio.pause();
			audio.currentTime = 0;
		}
	});

	// Reset button icons if they are currently displaying the stop image
	document
		.querySelectorAll(".thumbnail, .audio-btn, .audio-button-image")
		.forEach((btn) => {
			if (btn.src && btn.src.includes("stop-")) {
				btn.src = ASSETS.playImg;
			}
		});
}

/**
 * Unified Master Controller for Play/Pause and UI handling
 * Combines: PlayAndShow, PlayAndShowWithNav, PlaySound, and PlayAndShowGallery
 */
function handleAudioToggle(options = {}) {
	const {
		audioId,
		imageId,
		textId = null,
		navLeftId = null,
		navRightId = null,
		showNativeControls = false,
		hideImageOnReset = false,
	} = options;

	const myAudio = document.getElementById(audioId);
	const myButton = document.getElementById(imageId);
	const myText = textId ? document.getElementById(textId) : null;
	const navLeft = navLeftId ? document.getElementById(navLeftId) : null;
	const navRight = navRightId ? document.getElementById(navRightId) : null;

	if (!myAudio) return console.error("Audio element not found:", audioId);

	// If it's paused, let's play it
	if (myAudio.paused) {
		resetOtherAudio(audioId); // Mute everything else first

		myAudio.play();
		if (myAudio.tagName === "AUDIO" && showNativeControls)
			myAudio.style.display = "block";
		if (myButton) {
			myButton.style.visibility = "visible";
			myButton.src = ASSETS.stopImg;
		}
		if (myText) myText.style.display = "flex";
		if (navLeft) navLeft.style.visibility = "hidden";
		if (navRight) navRight.style.visibility = "hidden";

		// Memory-safe hook: Replaces any previous inline hook cleanly
		myAudio.onended = () => {
			handleAudioReset(options);
		};
	} else {
		// If it's already playing, pause and reset it manually
		handleAudioReset(options);
	}
}

/**
 * Unified Reset Mechanism
 * Combines: ResetPlayAndShow, ResetPlayAndShowWithNav, ResetPlayAndShowGallery
 */
function handleAudioReset(options = {}) {
	const { audioId, imageId, textId, navLeftId, navRightId, hideImageOnReset } =
		options;

	const myAudio = document.getElementById(audioId);
	const myButton = document.getElementById(imageId);
	const myText = textId ? document.getElementById(textId) : null;
	const navLeft = navLeftId ? document.getElementById(navLeftId) : null;
	const navRight = navRightId ? document.getElementById(navRightId) : null;

	if (myAudio) {
		myAudio.pause();
		myAudio.currentTime = 0;
		myAudio.style.display = "none";
	}
	if (myText) myText.style.display = "none";
	if (myButton) {
		myButton.src = ASSETS.playImg;
		if (hideImageOnReset) myButton.style.visibility = "hidden";
	}
	if (navLeft) navLeft.style.visibility = "visible";
	if (navRight) navRight.style.visibility = "visible";
}

// --- BACKWARDS COMPATIBILITY WRAPPERS ---
// These wrap your old function names so you don't have to rewrite your HTML onclick attributes!

function PlayAndShow(audio, text, img) {
	handleAudioToggle({ audioId: audio, textId: text, imageId: img });
}
function ResetPlayAndShow(audio, text, img) {
	handleAudioReset({ audioId: audio, textId: text, imageId: img });
}
function PlayAndShowWithNav(audio, text, img, left, right) {
	handleAudioToggle({
		audioId: audio,
		textId: text,
		imageId: img,
		navLeftId: left,
		navRightId: right,
	});
}
function ResetPlayAndShowWithNav(audio, text, img, left, right) {
	handleAudioReset({
		audioId: audio,
		textId: text,
		imageId: img,
		navLeftId: left,
		navRightId: right,
	});
}
function PlaySound(audio, img) {
	handleAudioToggle({ audioId: audio, imageId: img });
}
function PlaySoundWithControls(audio, img) {
	handleAudioToggle({ audioId: audio, imageId: img, showNativeControls: true });
}
function PlayAndShowGallery(audio, text, img) {
	handleAudioToggle({ audioId: audio, imageId: img });
}
function ResetPlayAndShowGallery(audio, text, img) {
	handleAudioReset({ audioId: audio, imageId: img, hideImageOnReset: true });
}
function PlayQuickSound(audio) {
	handleAudioToggle({ audioId: audio });
}
function HideDiv(textDiv) {
	const el = document.getElementById(textDiv);
	if (el) el.style.display = "none";
	resetOtherAudio();
}
function stopAllAudio() {
	resetOtherAudio();
}

// --- OPTIMIZED EVENT DRIVERS ---

// Audio Hovers: Single Audio instance reused to prevent system cluttering
function playHoverSoundOnClass(className) {
	const hoverSound = new Audio(ASSETS.hoverSound);
	document.addEventListener("mouseover", (e) => {
		if (e.target.classList.contains(className)) {
			hoverSound.currentTime = 0;
			hoverSound.play().catch(() => {}); // Catches browser autoplay block policies safely
		}
	});
}

// Fullscreen Router logic
function toggleFullScreen() {
	const doc = window.document;
	const docEl = doc.documentElement;
	const request =
		docEl.requestFullscreen ||
		docEl.mozRequestFullScreen ||
		docEl.webkitRequestFullScreen ||
		docEl.msRequestFullscreen;
	const cancel =
		doc.exitFullscreen ||
		doc.mozCancelFullScreen ||
		doc.webkitExitFullscreen ||
		doc.msFullscreen;

	if (
		!doc.fullscreenElement &&
		!doc.mozFullScreenElement &&
		!doc.webkitFullscreenElement &&
		!doc.msFullscreenElement
	) {
		if (request) request.call(docEl);
	} else {
		if (cancel) cancel.call(doc);
	}
}

// Setup Event Listeners globally via Event Delegation (massive performance save)
document.addEventListener("DOMContentLoaded", () => {
	playHoverSoundOnClass("clickable");

	// Unified Fullscreen Click router for Links & Buttons
	document.addEventListener("click", (e) => {
		const targetLink = e.target.closest(".fullscreenLink");
		const targetBtn = e.target.closest(".fullscreenButton");

		if (!targetLink && !targetBtn) return;
		e.preventDefault();

		let urlToOpen = targetLink
			? targetLink.getAttribute("href")
			: targetBtn.getAttribute("data-url");

		try {
			const parsedUrl = new URL(urlToOpen, window.location.origin);
			urlToOpen = parsedUrl.href;
		} catch (error) {
			return console.error("Invalid Target URL Validation Failed:", urlToOpen);
		}

		if (!document.fullscreenElement) {
			window.location.href = urlToOpen;
		} else {
			document.documentElement
				.requestFullscreen()
				.then(() => {
					window.location.href = urlToOpen;
				})
				.catch((err) =>
					console.error("Error setting full-screen redirection:", err),
				);
		}
	});
});

// Tooltip positioning track optimization (Using RequestAnimationFrame for buttery smoothness)
let ticking = false;
document.addEventListener("mousemove", (e) => {
	if (!ticking) {
		window.requestAnimationFrame(() => {
			const tooltip = document.querySelector(".tooltip:hover .tooltiptext");
			if (tooltip) {
				tooltip.style.left = `${e.clientX}px`;
				tooltip.style.top = `${e.clientY}px`;
			}
			ticking = false;
		});
		ticking = true;
	}
});

function stopAudioPlayer() {
	stopAllAudio();
}
