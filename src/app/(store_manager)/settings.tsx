import React from "react";
import { SharedSettingsLayout } from "@/components/settings/shared-settings-layout";
import { ActiveSessionSection } from "@/components/store_manager/session/active-sessions-section";

export default function Settings() {
    return (
        <SharedSettingsLayout 
            copyrightRole="Store Manager" 
            extraCards={<ActiveSessionSection />} 
        />
    );
}