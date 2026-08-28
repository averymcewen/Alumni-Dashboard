/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                'weber-purple': '#4a0066',
                'weber-purple-light': '#7a1e96',
                'weber-purple-dark': '#320044',
                'accent-gold': '#f2c94c',
                'accent-teal': '#38b2ac',
                'success': '#10b981',
                'warning': '#f59e0b',
                'error': '#ef4444',
                'neutral-50': '#fafafa',
                'neutral-100': '#f5f5f5',
                'neutral-200': '#e5e5e5',
                'neutral-300': '#d4d4d4',
                'neutral-400': '#a3a3a3',
                'neutral-500': '#737373',
                'neutral-600': '#525252',
                'neutral-700': '#404040',
                'neutral-800': '#262626',
                'neutral-900': '#171717',
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'display': ['Montserrat', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};