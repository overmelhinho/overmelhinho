/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Institucionais
        primary: {
          DEFAULT: 'hsl(var(--primary))',           // Vermelho institucional
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',         // Amarelo institucional
          foreground: 'hsl(var(--secondary-foreground))',
        },
        background: 'hsl(var(--background))',       // Fundo principal
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // Extras institucionais e status
        alert: '#FDB913',           // Amarelo de alerta/destaque
        success: '#37B24D',         // Verde de sucesso
        warning: '#FFA500',         // Laranja de atenção
        danger: '#B70F0A',          // Vermelho de erro (igual ao institucional)
        muted: '#E0E0E0',           // Cinza claro, linhas/tabela
        black: '#000000',
        white: '#ffffff',
        foreground: 'hsl(var(--foreground))', // Texto principal
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        }
      },
      fontFamily: {
        // Fonte institucional: Poppins (fallback Montserrat e system-ui)
        sans: [
          'Poppins',
          'Montserrat',
          'system-ui',
          'sans-serif',
        ],
        serif: [
          'Playfair Display',
          'serif',
        ],
      },


    animation: {
      "fade-in": "fadeIn 0.25s ease-in-out",
      "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      "shimmer": "shimmer 3s infinite",
      "glow-pulse": "glowPulse 3s infinite",
    },
    keyframes: {
      fadeIn: {
        "0%": { opacity: 0, transform: "translateY(10px)" },
        "100%": { opacity: 1, transform: "translateY(0)" },
      },
      fadeInUp: {
        "0%": { opacity: 0, transform: "translateY(20px)" },
        "100%": { opacity: 1, transform: "translateY(0)" },
      },
      shimmer: {
        "100%": { transform: "translateX(100%)" },
      },
      glowPulse: {
        "0%, 100%": { boxShadow: "0 0 15px 0px rgba(183, 15, 10, 0.3)" },
        "50%": { boxShadow: "0 0 30px 5px rgba(183, 15, 10, 0.6)" },
      },
    },

      borderRadius: {
        // Consistência institucional de radius
        lg: 'var(--radius)',              // Ex: 1rem (16px)
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
