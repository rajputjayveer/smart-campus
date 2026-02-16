// src/components/RealTimeOrderTracker.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Package, Utensils } from 'lucide-react';
import confetti from 'canvas-confetti';

const orderStages = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'preparing', label: 'Preparing', icon: Utensils },
    { key: 'ready', label: 'Ready for Pickup', icon: CheckCircle },
    { key: 'completed', label: 'Completed', icon: CheckCircle }
];

const RealTimeOrderTracker = ({ currentStage = 'pending', pickupTime }) => {
    const currentStageIndex = orderStages.findIndex(stage => stage.key === currentStage);

    React.useEffect(() => {
        if (currentStage === 'completed') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [currentStage]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Order Status</h3>

            {/* Progress Bar */}
            <div className="relative mb-8">
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700"></div>
                <motion.div
                    className="absolute top-5 left-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStageIndex / (orderStages.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                ></motion.div>

                <div className="relative flex justify-between">
                    {orderStages.map((stage, index) => {
                        const Icon = stage.icon;
                        const isCompleted = index <= currentStageIndex;
                        const isCurrent = index === currentStageIndex;

                        return (
                            <div key={stage.key} className="flex flex-col items-center">
                                <motion.div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                        }`}
                                    initial={{ scale: 1 }}
                                    animate={{
                                        scale: isCurrent ? [1, 1.2, 1] : 1,
                                        boxShadow: isCurrent ? '0 0 20px rgba(99, 102, 241, 0.5)' : 'none'
                                    }}
                                    transition={{ duration: 0.5, repeat: isCurrent ? Infinity : 0, repeatDelay: 1 }}
                                >
                                    <Icon className="h-5 w-5" />
                                </motion.div>
                                <p className={`mt-2 text-xs text-center ${isCompleted ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'
                                    }`}>
                                    {stage.label}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Estimated Time */}
            {pickupTime && (
                <div className="flex items-center justify-center space-x-2 bg-indigo-50 dark:bg-indigo-900 rounded-xl p-3">
                    <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                        Pickup: {pickupTime}
                    </span>
                </div>
            )}
        </div>
    );
};

export default RealTimeOrderTracker;
