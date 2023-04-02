/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				"blue-0": "#007bc7",
				"blue-1": "#0098f7",
				"white-0": "#ffffff",
				"grey-0": "#b8b5b5",
				"grey-1": "#bec8db",
				"grey-2": "#c7d0e2",
				"dark-0": "#111d25",
				"dark-1": "#1c2830",
				"dark-2": "#202c34",
				"dark-3": "#2b3a44",
				"gradient-start": "#34d399",
				"gradient-end": "#0ea5e9",
				border: "#ffffff0d",
			},
			keyframes: {
				underline: {
					"0%": {},
				},
			},
		},
	},
	plugins: [],
};
