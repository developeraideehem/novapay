import React from 'react'

interface GradientCategoryCardProps {
    icon: string
    title: string
    subtitle: string
    gradientColors: [string, string]
    onPress: () => void
    disabled?: boolean
}

export const GradientCategoryCard: React.FC<GradientCategoryCardProps> = ({
    icon,
    title,
    subtitle,
    gradientColors,
    onPress,
    disabled = false,
}) => {
    const gradientStyle = {
        background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`,
    }

    return (
        <button
            onClick={disabled ? undefined : onPress}
            disabled={disabled}
            className={`
        w-full mb-4 rounded-[20px] overflow-hidden shadow-lg
        transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
        ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            <div
                style={gradientStyle}
                className="flex items-center p-5 min-h-[90px]"
            >
                {/* Icon Container */}
                <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center mr-4">
                    <span className="text-[32px]">{icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                    <p className="text-sm text-white/90">{subtitle}</p>
                </div>

                {/* Chevron or Badge */}
                {!disabled ? (
                    <span className="text-[32px] text-white/80 font-light">›</span>
                ) : (
                    <div className="bg-white/30 px-3 py-1.5 rounded-xl">
                        <span className="text-[11px] font-bold text-white">Soon</span>
                    </div>
                )}
            </div>
        </button>
    )
}
