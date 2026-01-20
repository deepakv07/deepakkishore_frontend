/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    blue: '#2563EB',
                },
                bg: {
                    main: 'var(--bg-main)',
                },
                text: {
                    main: 'var(--text-main)',
                },
                card: {
                    bg: 'var(--card-bg)',
                },
                border: {
                    color: 'var(--border-color)',
                },
            },
        },
    },
    plugins: [],
}
