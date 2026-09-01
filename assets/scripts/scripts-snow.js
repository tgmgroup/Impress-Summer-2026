// Combined script for theme, targeted slider, snowflakes, and toggles

// --- Theme Toggle Logic ---
// [NO CHANGES HERE - Keep the original theme logic]
const themeToggleButton = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;
const sunIcon = "&#x2600;"; // ☀️ Sun icon
const moonIcon = "&#x1F319;"; // 🌙 Moon icon

function applyTheme(theme) {
	const isDark = theme === "dark";
	htmlElement.classList.toggle("dark", isDark);
	if (themeToggleButton) {
		themeToggleButton.innerHTML = isDark ? sunIcon : moonIcon;
	}
	try {
		localStorage.setItem("theme", theme);
	} catch (e) {
		console.warn("Could not save theme preference to localStorage.", e);
	}
}

function initializeTheme() {
	let currentTheme = "dark"; // Default to dark
	try {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme === "light" || savedTheme === "dark") {
			currentTheme = savedTheme;
		} else {
			// No saved theme, check system preference
			if (
				window.matchMedia &&
				window.matchMedia("(prefers-color-scheme: light)").matches
			) {
				currentTheme = "light"; // Only switch default if system prefers light
			}
		}
	} catch (e) {
		console.warn("Could not read theme preference from localStorage.", e);
	}
	applyTheme(currentTheme);
}

if (themeToggleButton) {
	themeToggleButton.addEventListener("click", () => {
		const isDark = htmlElement.classList.contains("dark");
		applyTheme(isDark ? "light" : "dark");
	});
} else {
	console.warn("Theme toggle button ('#theme-toggle') not found.");
}

try {
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", (event) => {
			// Only react if no theme manually set via localStorage
			try {
				if (!localStorage.getItem("theme")) {
					applyTheme(event.matches ? "dark" : "light");
				}
			} catch (e) {
				console.warn(
					"Could not access localStorage in system theme listener.",
					e,
				);
			}
		});
} catch (e) {
	console.warn(
		"System theme change listener not supported or failed to attach.",
		e,
	);
}
// --- End Theme Toggle Logic ---

// --- Snowflake Effect Logic (Modified for Leaf Fluttering and Performance) ---

const snowFall = (() => {
	//----------------------------------
	// Internal State
	//----------------------------------
	let canvas = null;
	let ctx = null;
	let width = 0;
	let height = 0;
	let flakes = []; // Array to hold Flake/Leaf objects
	let flakeRequestPerFrame = 0; // How many flakes to create per frame (calculated in resize)
	let isRunning = false; // Flag to control the animation loop
	let animationFrameId = null; // Store the requestAnimationFrame ID

	//----------------------------------
	// Constants
	//----------------------------------
	const FLAKE_FREQUENCY = 1;
	const FLAKE_MIN_SPEED = 10;
	const FLAKE_MAX_SPEED = 100;
	const FLAKE_SIZE_NOISE = 0.9;
	const FLAKE_MIN_SIZE = 6; // Adjusted minimum size for visible leaves
	const FLAKE_MAX_SIZE = 14; // Adjusted maximum size for visible leaves
	const FLAKE_FRICTION = 0.035;
	const FLAKE_NOISE_X = 0.07;
	const FLAKE_NOISE_Y = 0.02;
	const PI = Math.PI;
	const FPS = 60;

	//----------------------------------
	// Objects (Point, Vector, Particle, Flake)
	//----------------------------------

	class Point {
		constructor(x = 0, y = 0) {
			this.x = x;
			this.y = y;
		}
		translate(translateVect) {
			this.x += translateVect.x;
			this.y += translateVect.y;
		}
	}

	class Vector {
		static add(vectors) {
			let result = new Vector(0, 0);
			vectors.forEach((vector) => {
				result.x += vector.x;
				result.y += vector.y;
			});
			return result;
		}
		constructor(x = 0, y = 0) {
			this.x = x;
			this.y = y;
		}
		get length() {
			return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
		}
	}

	class Particle {
		static deduceMass(targetSpeed, friction) {
			return targetSpeed.y * friction;
		}
		constructor(
			position = { x: 0, y: 0 },
			{ mass = 0, friction = 0, initialSpeed = { x: 0, y: 0 } },
		) {
			this.position = new Point(position.x, position.y);
			this.mass = mass;
			this.friction = friction;
			this.speed = new Vector(initialSpeed.x, initialSpeed.y);
			this.forces = new Map(); // Still keep for gravity/friction, but not external forces
		}

		setForce(forceName, forceValue = { x: 0, y: 0 }) {
			this.forces.set(forceName, new Vector(forceValue.x, forceValue.y));
		}

		applyGravity() {
			this.setForce("weight", { x: 0, y: this.mass });
		}

		applyFriction() {
			this.setForce("friction", {
				x: -this.speed.x * this.friction,
				y: -this.speed.y * this.friction,
			});
		}

		updateSpeedAndPosition() {
			if (this.mass) this.applyGravity();
			if (this.friction) this.applyFriction();
			// Only sum gravity and friction forces
			const acceleration = Vector.add(Array.from(this.forces.values()));
			this.forces.clear();
			this.speed = Vector.add([this.speed, acceleration]);
			this.position.translate(this.speed);
		}
	}

	class Flake extends Particle {
		constructor(position = { x: 0, y: 0 }) {
			const depth = random(0, 100) / 100;
			const initialSpeed = {
				x: 0,
				y:
					(FLAKE_MIN_SPEED + depth * (FLAKE_MAX_SPEED - FLAKE_MIN_SPEED)) / FPS,
			};
			const mass = Particle.deduceMass(initialSpeed, FLAKE_FRICTION);

			super(position, {
				mass: mass,
				friction: FLAKE_FRICTION,
				initialSpeed: { x: initialSpeed.x, y: initialSpeed.y },
			});

			this.depth = depth;
			this.size = FLAKE_MIN_SIZE + depth * (FLAKE_MAX_SIZE - FLAKE_MIN_SIZE);
			this.size =
				this.size * (1 + FLAKE_SIZE_NOISE * (random(-100, 100) / 100));

			// Added Leaf sway, rotation, and palette properties
			this.swingValue = Math.random() * 100;
			this.swingSpeed = Math.random() * 0.02 + 0.01;
			this.angle = Math.random() * 360;
			this.spinSpeed = Math.random() * 2 - 1;

			const leafColors = [
				"#a2b997",
				"#b5caaa",
				"#8fa883",
				"#fbc4cb",
				"#f9b1ba",
			];
			this.color = leafColors[Math.floor(Math.random() * leafColors.length)];
		}

		evolve() {
			// Calculate new speed and position based on gravity/friction
			this.updateSpeedAndPosition();

			// Flutter physics: smooth horizontal sway using sine calculations
			this.swingValue += this.swingSpeed;
			this.position.x += Math.sin(this.swingValue) * 0.5;
			this.angle += this.spinSpeed;

			// Apply positional noise *after* main physics calculation
			this.applyNoise();
		}

		applyNoise() {
			const noiseForce = new Vector(
				(random(-100, 100) / 100) * FLAKE_NOISE_X * this.depth,
				(random(-100, 100) / 100) * FLAKE_NOISE_Y * this.depth,
			);
			this.position.translate(noiseForce);
		}

		draw(ctx) {
			if (!ctx) return; // Safety check
			ctx.save();

			// Move coordinate frame to center of leaf to cleanly execute rotation angles
			ctx.translate(this.position.x, this.position.y);
			ctx.rotate((this.angle * Math.PI) / 180);

			ctx.beginPath();
			// Upgraded simple pixel dot into a clean native geometric leaf ellipse shape
			ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, 2 * PI);

			ctx.fillStyle = this.color;
			ctx.fill();
			ctx.restore();
		}
	}

	//----------------------------------
	// Utils
	//----------------------------------
	function random(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function chance(probability) {
		const prob = Math.max(0, Math.min(1, probability));
		return Math.random() < prob;
	}

	//----------------------------------
	// Core Logic
	//----------------------------------

	function resize() {
		if (!canvas) return;
		const { innerWidth, innerHeight } = window;
		canvas.width = innerWidth;
		canvas.height = innerHeight;
		width = innerWidth;
		height = innerHeight;
		flakeRequestPerFrame = ((width / 100) * FLAKE_FREQUENCY) / FPS;
	}

	function draw() {
		if (!isRunning) {
			animationFrameId = null;
			return;
		}

		if (ctx) {
			ctx.clearRect(0, 0, width, height);
		} else {
			console.error("Snowfall: Canvas context lost.");
			stop();
			return;
		}

		let nbFlakeToCreate = Math.floor(flakeRequestPerFrame);
		if (chance(flakeRequestPerFrame % 1)) {
			nbFlakeToCreate++;
		}
		for (let i = 0; i < nbFlakeToCreate; i++) {
			flakes.push(new Flake({ x: random(0, width), y: -FLAKE_MAX_SIZE * 2 }));
		}

		for (let i = flakes.length - 1; i >= 0; i--) {
			const flake = flakes[i];
			const removalPadding = 50;

			if (
				flake.position.y > height + removalPadding ||
				flake.position.x < -removalPadding ||
				flake.position.x > width + removalPadding
			) {
				flakes.splice(i, 1);
				continue;
			}

			flake.evolve();
			flake.draw(ctx);
		}

		animationFrameId = window.requestAnimationFrame(draw);
	}

	//----------------------------------
	// Public Interface
	//----------------------------------
	function init() {
		canvas = document.getElementById("snowfall");
		if (!canvas || typeof canvas.getContext !== "function") {
			console.error(
				"Snowfall effect requires a <canvas id='snowfall'></canvas> element.",
			);
			return false;
		}
		ctx = canvas.getContext("2d");

		resize();
		window.addEventListener("resize", resize);

		console.log("Snowfall initialized.");
		return true;
	}

	function start() {
		if (!canvas) {
			console.error(
				"Snowfall cannot start: not initialized or canvas not found.",
			);
			return;
		}
		if (isRunning) return;

		isRunning = true;
		canvas.style.display = "block";
		console.log("Snowfall started.");
		if (!animationFrameId) {
			draw();
		}
	}

	function stop() {
		if (!isRunning) return;

		isRunning = false;
		if (animationFrameId) {
			window.cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		if (canvas) {
			canvas.style.display = "none";
		}
		console.log("Snowfall stopped.");
	}

	return {
		init: init,
		start: start,
		stop: stop,
	};
})();

// --- End Snowflake Effect Logic ---

// --- Snowfall Toggle Logic (Uses new start/stop and Spring Leaf icons) ---
const snowToggleButton = document.getElementById("snow-toggle");
const noSnowIcon = "&#x1F344;"; // 🍂 Fallen Leaf / Off Icon
const snowIcon = "&#x1F342;"; // 🍁 Falling Leaf / On Icon
let isSnowEnabled = false;

function setInitialSnowState() {
	try {
		const savedSnowPref = localStorage.getItem("snowEnabled");
		isSnowEnabled = savedSnowPref !== "false";
	} catch (e) {
		console.warn("Could not read snow preference from localStorage.", e);
		isSnowEnabled = true;
	}

	if (snowToggleButton) {
		snowToggleButton.innerHTML = isSnowEnabled ? snowIcon : noSnowIcon;
	}
}

function toggleSnow() {
	if (
		!snowFall ||
		typeof snowFall.start !== "function" ||
		typeof snowFall.stop !== "function"
	) {
		console.error("Snowfall controller (start/stop methods) not available.");
		return;
	}

	isSnowEnabled = !isSnowEnabled;

	if (isSnowEnabled) {
		snowFall.start();
		if (snowToggleButton) snowToggleButton.innerHTML = snowIcon;
		try {
			localStorage.setItem("snowEnabled", "true");
		} catch (e) {
			console.warn("Could not save snow preference.", e);
		}
	} else {
		snowFall.stop();
		if (snowToggleButton) snowToggleButton.innerHTML = noSnowIcon;
		try {
			localStorage.setItem("snowEnabled", "false");
		} catch (e) {
			console.warn("Could not save snow preference.", e);
		}
	}
}

if (snowToggleButton) {
	snowToggleButton.addEventListener("click", toggleSnow);
} else {
	console.warn("Snow toggle button ('#snow-toggle') not found.");
}
// --- End Snowfall Toggle Logic ---

// --- Initializations ---
initializeTheme();
setInitialSnowState();

// Initialize snowflake effect after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	if (typeof snowFall !== "undefined" && typeof snowFall.init === "function") {
		if (snowFall.init()) {
			console.log("DOM Ready: Snowfall initialized successfully.");
			if (isSnowEnabled) {
				console.log("DOM Ready: Starting snowfall based on initial state.");
				snowFall.start();
			} else {
				console.log("DOM Ready: Snowfall initially disabled.");
				const canvas = document.getElementById("snowfall");
				if (canvas) canvas.style.display = "none";
			}
		} else {
			console.error(
				"DOM Ready: Snowfall initialization failed (e.g., canvas not found).",
			);
		}
	} else {
		console.error("DOM Ready: Snowfall object or init method not found.");
	}
});
// --- End Initializations ---
