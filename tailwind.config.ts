import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#7C3AED',
					foreground: 'hsl(var(--primary-foreground))',
					50: '#F5F3FF',
					100: '#EDE9FE',
					200: '#DDD6FE',
					300: '#C4B5FD',
					400: '#A78BFA',
					500: '#8B5CF6',
					600: '#7C3AED',
					700: '#6D28D9',
					800: '#5B21B6',
					900: '#4C1D95',
				},
				secondary: {
					DEFAULT: '#EC4899',
					foreground: 'hsl(var(--secondary-foreground))',
					50: '#FDF2F8',
					100: '#FCE7F3',
					200: '#FBCFE8',
					300: '#F9A8D4',
					400: '#F472B6',
					500: '#EC4899',
					600: '#DB2777',
					700: '#BE185D',
					800: '#9D174D',
					900: '#831843',
				},
				accent: {
					DEFAULT: '#06B6D4',
					foreground: 'hsl(var(--accent-foreground))',
					50: '#ECFEFF',
					100: '#CFFAFE',
					200: '#A5F3FC',
					300: '#67E8F9',
					400: '#22D3EE',
					500: '#06B6D4',
					600: '#0891B2',
					700: '#0E7490',
					800: '#155E75',
					900: '#164E63',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				brand: {
					50: '#ebf5ff',
					100: '#deecff',
					200: '#c6ddff',
					300: '#a1c5ff',
					400: '#76a2ff',
					500: '#4c7dff',
					600: '#2152ff',
					700: '#0e3ee6',
					800: '#0e33ba',
					900: '#122c93',
				},
				sealtrack: {
					primary: '#1e3a8a',
					secondary: '#0ea5e9',
					accent: '#06b6d4',
					background: '#f8fafc',
					text: '#0f172a',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'fade-up': {
					from: { opacity: '0', transform: 'translateY(20px)' },
					to: { opacity: '1', transform: 'translateY(0)' },
				},
				'slide-in': {
					from: { transform: 'translateX(-100%)' },
					to: { transform: 'translateX(0)' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-up': 'fade-up 0.5s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				'float': 'float 6s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
