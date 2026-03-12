/**
 * Translations for the Puntos app.
 *
 * Keys are written in English (snake_case). Add new keys here when you
 * need to localise more screens, then consume them via `useTranslation()`.
 */

export type Language = 'en' | 'ja';

export type TranslationKey = keyof typeof translations.en;

const translations = {
    en: {
        // ── Settings screen ──────────────────────────────────────
        settings_title: 'Settings',
        loading_profile: 'Loading profile...',

        // Section headers
        section_account: 'ACCOUNT SETTINGS',
        section_notifications: 'NOTIFICATIONS & PRIVACY',
        section_language: 'LANGUAGE',

        // Language card
        language_label: 'Language',
        language_subtitle: 'Switch app language',
        language_en: 'EN',
        language_ja: '日本語',

        // Notifications & Privacy toggles
        nearby_alerts_label: 'Nearby Alerts',
        nearby_alerts_subtitle: 'Get notified when rewards are close',

        location_label: 'Location Access',
        location_checking: 'Checking...',
        location_granted: 'Access Granted',
        location_denied: 'Access Denied',
        location_enabled: 'Enabled',
        location_disabled: 'Disabled',

        // Location alert
        location_alert_title: 'Disable Location Access',
        location_alert_message:
            "To completely revoke location permissions, you must disable the setting in your device's settings menu. Would you like to open it now?",
        location_alert_cancel: 'Cancel',
        location_alert_open: 'Open Settings',

        promo_emails_label: 'Promotional Emails',

        // Footer
        footer_copyright: 'Copyright 2026',
    },

    ja: {
        // ── 設定画面 ──────────────────────────────────────────────
        settings_title: '設定',
        loading_profile: 'プロフィールを読み込み中...',

        // セクションヘッダー
        section_account: 'アカウント設定',
        section_notifications: '通知 & プライバシー',
        section_language: '言語',

        // 言語カード
        language_label: '言語',
        language_subtitle: 'アプリの言語を切り替える',
        language_en: 'EN',
        language_ja: '日本語',

        // 通知 & プライバシー
        nearby_alerts_label: '近隣アラート',
        nearby_alerts_subtitle: '近くのリワードを通知する',

        location_label: '位置情報アクセス',
        location_checking: '確認中...',
        location_granted: 'アクセス許可済み',
        location_denied: 'アクセス拒否',
        location_enabled: '有効',
        location_disabled: '無効',

        // 位置情報アラート
        location_alert_title: '位置情報アクセスを無効にする',
        location_alert_message:
            '位置情報の権限を完全に取り消すには、デバイスの設定メニューで無効にしてください。今すぐ設定を開きますか？',
        location_alert_cancel: 'キャンセル',
        location_alert_open: '設定を開く',

        promo_emails_label: 'プロモーションメール',

        // フッター
        footer_copyright: 'Copyright 2026',
    },
} as const;

export default translations;
