/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
    	extend: {
    		colors: {
    			navy: {
    				'950': '#0a1628',
    				'900': '#112240',
    				'800': '#1e293b',
    				'700': '#334155'
    			},
    			cyan: {
    				'500': '#00a8e8',
    				'400': '#38bdf8',
    				'600': '#0284c7'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		fontFamily: {
    			sans: ['Inter', 'system-ui', 'sans-serif'],
    			heading: ['Manrope', 'system-ui', 'sans-serif'],
    			mono: ['SF Mono', 'Monaco', 'monospace']
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		boxShadow: {
    			'glow': '0 0 15px rgba(0, 168, 232, 0.3)',
    			'glow-lg': '0 0 25px rgba(0, 168, 232, 0.5)',
    			'card': '0 8px 30px rgba(0, 0, 0, 0.24)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: { height: '0' },
    				to: { height: 'var(--radix-accordion-content-height)' }
    			},
    			'accordion-up': {
    				from: { height: 'var(--radix-accordion-content-height)' },
    				to: { height: '0' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
};
