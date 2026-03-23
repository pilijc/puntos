import React from 'react';
import { type SafeAreaViewProps } from 'react-native-safe-area-context';
import { SafeAreaView } from '@/tw';

export interface ScreenWrapperProps extends SafeAreaViewProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenWrapper({ 
  children, 
  className = "flex-1 bg-background", 
  edges = ["top", "left", "right"], 
  ...props 
}: ScreenWrapperProps) {
  return (
    <SafeAreaView className={className} edges={edges} {...props}>
      {children}
    </SafeAreaView>
  );
}