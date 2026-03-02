import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GradientCategoryCard } from '../../components/GradientCategoryCard'

export const BillsScreen: React.FC = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-2xl mx-auto px-4 py-5 flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Pay Bills</h1>
                        <p className="text-blue-100 text-sm">Quick and easy bill payments</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                <h2 className="text-base font-semibold text-gray-700">Select Bill Type</h2>

                <GradientCategoryCard
                    icon="⚡"
                    title="Electricity"
                    subtitle="IKEDC, EKEDC, IBEDC, AEDC & more"
                    gradientColors={['#F59E0B', '#F97316']}
                    onPress={() => navigate('/electricity')}
                />

                <GradientCategoryCard
                    icon="📺"
                    title="Cable TV"
                    subtitle="DStv, GOtv, StarTimes"
                    gradientColors={['#8B5CF6', '#EC4899']}
                    onPress={() => navigate('/cable-tv')}
                />

                <GradientCategoryCard
                    icon="🌐"
                    title="Internet"
                    subtitle="Coming soon"
                    gradientColors={['#3B82F6', '#6366F1']}
                    onPress={() => { }}
                    disabled
                />

                <GradientCategoryCard
                    icon="💧"
                    title="Water"
                    subtitle="Coming soon"
                    gradientColors={['#10B981', '#059669']}
                    onPress={() => { }}
                    disabled
                />
            </div>
        </div>
    )
}
