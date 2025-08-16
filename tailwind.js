tailwind.config = {
    theme: {
        extend: {
            colors: {
                'primary': '#3B82F6',
                'secondary': '#8B5CF6',
                'success': '#10B981',
                'warning': '#F59E0B',
                'danger': '#EF4444',
                'urgent': '#EF4444',
                'normal': '#3B82F6',
                'low': '#6B7280'
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif']
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'fade-out': 'fadeOut 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'bounce-gentle': 'bounceGentle 2s infinite'
            }
        }
    },
    darkMode: 'class'
}