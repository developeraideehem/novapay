import React from 'react'

interface GradientActionCardProps {
    icon: string
    title: string
    onPress: () => void
}

export const GradientActionCard: React.FC<GradientActionCardProps> = ({
    icon,
    title,
    onPress,
}) => {
    return (
        <button
            onClick={onPress}
            className="
        bg-white rounded-2xl p-6 shadow-md 
        hover:shadow-xl transition-all duration-300 hover:scale-105
        flex flex-col items-center justify-center gap-3
        min-h-[140px] w-full
      "
        >
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">{icon}</span>
            </div>

            {/* Title */}
            <span className="text-base font-semibold text-gray-800 text-center">
                {title}
            </span>
        </button>
    )
}
