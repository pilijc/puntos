import React, { useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { View, Text, TouchableOpacity } from "@/tw";
import { ChevronUp, ChevronDown } from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface BaseAccordionCardProps {
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

export const BaseAccordionCard = ({ title, description, icon, children }: BaseAccordionCardProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(prev => !prev);
    };

    return (
        <View className="bg-background dark:bg-darkBackgroundCard p-3 overflow-hidden">
            <TouchableOpacity
                onPress={toggleOpen}
                className="flex-row items-center"
                activeOpacity={0.7}
            >
                {icon}
                <View className="flex-1 ml-3">
                    <Text className="text-base font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                        {title}
                    </Text>
                    {description && (
                        <Text className="text-xs font-poppins-regular text-textMuted dark:text-darkTextMuted" >
                            {description}
                        </Text>
                    )}
                </View>
                {isOpen ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
            </TouchableOpacity>

            {isOpen && (
                <View className="mt-2">
                    {children}
                </View>
            )}
        </View>
    );
};