// A flexible state tracker that initializes slideshows automatically as they are called
const slideshowStates = {};

// Helper to guarantee a slideshow track index exists in memory when called
function verifyStateExists(slideshowNum) {
	if (slideshowStates[slideshowNum] === undefined) {
		slideshowStates[slideshowNum] = 1;
	}
}

// Generic function to move forward or backward (+1 or -1)
function plusSlides(slideshowNum, n) {
	verifyStateExists(slideshowNum);
	slideshowStates[slideshowNum] += n;
	showSlides(slideshowNum, slideshowStates[slideshowNum]);
	if (typeof stopAllAudio === "function") stopAllAudio();
}

// Generic function to jump directly to a thumbnail slide (Capitalized version)
function currentSlide(slideshowNum, n) {
	verifyStateExists(slideshowNum);
	slideshowStates[slideshowNum] = n;
	showSlides(slideshowNum, slideshowStates[slideshowNum]);
	if (typeof stopAllAudio === "function") stopAllAudio();
}

/**
 * 🪟 CASE-SENSITIVITY BRIDGE:
 * This acts as a safety net. Since your HTML uses lowercase 'currentslide(3,1)',
 * this wrapper routes it directly to our main function so it never errors out!
 */
function currentslide(slideshowNum, n) {
	currentSlide(slideshowNum, n);
}

// Master function that handles all DOM manipulation for any slideshow
function showSlides(slideshowNum, n) {
	const slides = document.getElementsByClassName(`mySlides${slideshowNum}`);
	const thumbnails = document.getElementsByClassName(
		`thumbnail${slideshowNum}`,
	);

	// Guard rail: Break out if elements aren't loaded in the DOM yet or don't exist
	if (slides.length === 0) return;

	verifyStateExists(slideshowNum);

	// Handle wrapping around (looping seamlessly back to start or end)
	if (n > slides.length) slideshowStates[slideshowNum] = 1;
	if (n < 1) slideshowStates[slideshowNum] = slides.length;

	// Fetch the updated index value
	const activeIndex = slideshowStates[slideshowNum];

	// Hide all slides for this specific slideshow
	for (let i = 0; i < slides.length; i++) {
		slides[i].style.display = "none";
	}

	// Strip the active styling class from all thumbnails in this set
	for (let i = 0; i < thumbnails.length; i++) {
		thumbnails[i].className = thumbnails[i].className.replace(
			" active-thumbnail",
			"",
		);
	}

	// Display the active slide and highlight the corresponding thumbnail
	if (slides[activeIndex - 1]) {
		slides[activeIndex - 1].style.display = "flex";
	}
	if (thumbnails[activeIndex - 1]) {
		thumbnails[activeIndex - 1].className += " active-thumbnail";
	}
}

// Initialize ALL slideshows on the page dynamically when the DOM content loads
document.addEventListener("DOMContentLoaded", () => {
	// Automatically find any element with a class starting with "mySlides"
	const allSlides = document.querySelectorAll('[class^="mySlides"]');
	const uniqueSlideshowIDs = new Set();

	// Extract out the numbers (e.g., "mySlides3" -> 3)
	allSlides.forEach((slide) => {
		const match = slide.className.match(/mySlides(\d+)/);
		if (match) uniqueSlideshowIDs.add(parseInt(match[1], 10));
	});

	// Boot up every slideshow detected on your HTML layout page
	uniqueSlideshowIDs.forEach((id) => {
		showSlides(id, 1);
	});
});
