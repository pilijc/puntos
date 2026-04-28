import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en_frontdesk_transaction from './en/frontdesk/transaction.json';
import en_frontdesk_transactionHistory from './en/frontdesk/transactionHistory.json';
import en_label from './en/label.json';
import en_layout from './en/layout.json';
import en_onboarding_forgotPassword from './en/onboarding/forgotPassword.json';
import en_onboarding_login from './en/onboarding/login.json';
import en_onboarding_resetPassword from './en/onboarding/resetPassword.json';
import en_onboarding_signup from './en/onboarding/signup.json';
import en_onboarding_slide from './en/onboarding/slide.json';
import en_onboarding_index from './en/onboarding/index.json';
import en_settings_account from './en/settings/account.json';
import en_settings_deviceSessions from './en/settings/deviceSessions.json';
import en_settings_logout from './en/settings/logout.json';
import en_settings_notificationsPrivacy from './en/settings/notificationsPrivacy.json';
import en_settings_profile from './en/settings/profile.json';
import en_settings_index from './en/settings/index.json';
import en_store_manager_createStore from './en/store_manager/createStore.json';
import en_store_manager_dashboard from './en/store_manager/dashboard.json';
import en_store_manager_detail from './en/store_manager/detail.json';
import en_store_manager_detailEdit from './en/store_manager/detailEdit.json';
import en_store_manager_qr from './en/store_manager/qr.json';
import en_store_manager_qrConfigure from './en/store_manager/qrConfigure.json';
import en_store_manager_reward from './en/store_manager/reward.json';
import en_store_manager_rewardForm from './en/store_manager/rewardForm.json';
import en_store_manager_rewardView from './en/store_manager/rewardView.json';
import en_store_manager_staff from './en/store_manager/staff.json';
import en_store_manager_staffForm from './en/store_manager/staffForm.json';
import en_store_manager_stamp from './en/store_manager/stamp.json';
import en_store_manager_stampConfigure from './en/store_manager/stampConfigure.json';
import en_store_manager_storeTypes from './en/store_manager/storeTypes.json';
import en_store_manager_stores from './en/store_manager/stores.json';
import en_store_manager_streak from './en/store_manager/streak.json';
import en_store_manager_streakConfigure from './en/store_manager/streakConfigure.json';
import en_store_manager_subscription from './en/store_manager/subscription.json';
import en_store_manager_tabs from './en/store_manager/tabs.json';
import en_store_manager_transactions from './en/store_manager/transactions.json';
import en_store_manager_viewStore from './en/store_manager/viewStore.json';
import en_super_admin_dashboard from './en/super_admin/dashboard.json';
import en_super_admin_stores from './en/super_admin/stores.json';
import en_super_admin_subscription from './en/super_admin/subscription.json';
import en_super_admin_users from './en/super_admin/users.json';
import en_user_activity from './en/user/activity.json';
import en_user_discover from './en/user/discover.json';
import en_user_qr from './en/user/qr.json';
import en_user_rewards from './en/user/rewards.json';
import ja_frontdesk_transaction from './ja/frontdesk/transaction.json';
import ja_frontdesk_transactionHistory from './ja/frontdesk/transactionHistory.json';
import ja_label from './ja/label.json';
import ja_layout from './ja/layout.json';
import ja_onboarding_forgotPassword from './ja/onboarding/forgotPassword.json';
import ja_onboarding_login from './ja/onboarding/login.json';
import ja_onboarding_resetPassword from './ja/onboarding/resetPassword.json';
import ja_onboarding_signup from './ja/onboarding/signup.json';
import ja_onboarding_slide from './ja/onboarding/slide.json';
import ja_onboarding_index from './ja/onboarding/index.json';
import ja_settings_account from './ja/settings/account.json';
import ja_settings_deviceSessions from './ja/settings/deviceSessions.json';
import ja_settings_logout from './ja/settings/logout.json';
import ja_settings_notificationsPrivacy from './ja/settings/notificationsPrivacy.json';
import ja_settings_profile from './ja/settings/profile.json';
import ja_settings_index from './ja/settings/index.json';
import ja_store_manager_createStore from './ja/store_manager/createStore.json';
import ja_store_manager_dashboard from './ja/store_manager/dashboard.json';
import ja_store_manager_detail from './ja/store_manager/detail.json';
import ja_store_manager_detailEdit from './ja/store_manager/detailEdit.json';
import ja_store_manager_qr from './ja/store_manager/qr.json';
import ja_store_manager_qrConfigure from './ja/store_manager/qrConfigure.json';
import ja_store_manager_reward from './ja/store_manager/reward.json';
import ja_store_manager_rewardForm from './ja/store_manager/rewardForm.json';
import ja_store_manager_rewardView from './ja/store_manager/rewardView.json';
import ja_store_manager_staff from './ja/store_manager/staff.json';
import ja_store_manager_staffForm from './ja/store_manager/staffForm.json';
import ja_store_manager_stamp from './ja/store_manager/stamp.json';
import ja_store_manager_stampConfigure from './ja/store_manager/stampConfigure.json';
import ja_store_manager_storeTypes from './ja/store_manager/storeTypes.json';
import ja_store_manager_stores from './ja/store_manager/stores.json';
import ja_store_manager_streak from './ja/store_manager/streak.json';
import ja_store_manager_streakConfigure from './ja/store_manager/streakConfigure.json';
import ja_store_manager_subscription from './ja/store_manager/subscription.json';
import ja_store_manager_tabs from './ja/store_manager/tabs.json';
import ja_store_manager_transactions from './ja/store_manager/transactions.json';
import ja_store_manager_viewStore from './ja/store_manager/viewStore.json';
import ja_super_admin_dashboard from './ja/super_admin/dashboard.json';
import ja_super_admin_stores from './ja/super_admin/stores.json';
import ja_super_admin_subscription from './ja/super_admin/subscription.json';
import ja_super_admin_users from './ja/super_admin/users.json';
import ja_user_activity from './ja/user/activity.json';
import ja_user_discover from './ja/user/discover.json';
import ja_user_qr from './ja/user/qr.json';
import ja_user_rewards from './ja/user/rewards.json';
const resources = {
  en: {
    translation: {
      frontdesk: {
        transaction: en_frontdesk_transaction,
        transactionHistory: en_frontdesk_transactionHistory,
      },
      label: en_label,
      layout: en_layout,
      onboarding: {
        forgotPassword: en_onboarding_forgotPassword,
        login: en_onboarding_login,
        resetPassword: en_onboarding_resetPassword,
        signup: en_onboarding_signup,
        slide: en_onboarding_slide,
        ...en_onboarding_index,
      },
      settings: {
        account: en_settings_account,
        deviceSessions: en_settings_deviceSessions,
        logout: en_settings_logout,
        notificationsPrivacy: en_settings_notificationsPrivacy,
        profile: en_settings_profile,
        ...en_settings_index,
      },
      store_manager: {
        createStore: en_store_manager_createStore,
        dashboard: en_store_manager_dashboard,
        detail: en_store_manager_detail,
        detailEdit: en_store_manager_detailEdit,
        qr: en_store_manager_qr,
        qrConfigure: en_store_manager_qrConfigure,
        reward: en_store_manager_reward,
        rewardForm: en_store_manager_rewardForm,
        rewardView: en_store_manager_rewardView,
        staff: en_store_manager_staff,
        staffForm: en_store_manager_staffForm,
        stamp: en_store_manager_stamp,
        stampConfigure: en_store_manager_stampConfigure,
        storeTypes: en_store_manager_storeTypes,
        stores: en_store_manager_stores,
        streak: en_store_manager_streak,
        streakConfigure: en_store_manager_streakConfigure,
        subscription: en_store_manager_subscription,
        tabs: en_store_manager_tabs,
        transactions: en_store_manager_transactions,
        viewStore: en_store_manager_viewStore,
      },
      storeManager: {
        createStore: en_store_manager_createStore,
        dashboard: en_store_manager_dashboard,
        detail: en_store_manager_detail,
        detailEdit: en_store_manager_detailEdit,
        qr: en_store_manager_qr,
        qrConfigure: en_store_manager_qrConfigure,
        reward: en_store_manager_reward,
        rewardForm: en_store_manager_rewardForm,
        rewardView: en_store_manager_rewardView,
        staff: en_store_manager_staff,
        staffForm: en_store_manager_staffForm,
        stamp: en_store_manager_stamp,
        stampConfigure: en_store_manager_stampConfigure,
        storeTypes: en_store_manager_storeTypes,
        stores: en_store_manager_stores,
        streak: en_store_manager_streak,
        streakConfigure: en_store_manager_streakConfigure,
        subscription: en_store_manager_subscription,
        tabs: en_store_manager_tabs,
        transactions: en_store_manager_transactions,
        viewStore: en_store_manager_viewStore,
      },
      super_admin: {
        dashboard: en_super_admin_dashboard,
        stores: en_super_admin_stores,
        subscription: en_super_admin_subscription,
        users: en_super_admin_users,
      },
      superAdmin: {
        dashboard: en_super_admin_dashboard,
        stores: en_super_admin_stores,
        subscription: en_super_admin_subscription,
        users: en_super_admin_users,
      },
      user: {
        activity: en_user_activity,
        discover: en_user_discover,
        qr: en_user_qr,
        rewards: en_user_rewards,
      },
    }
  },
  ja: {
    translation: {
      frontdesk: {
        transaction: ja_frontdesk_transaction,
        transactionHistory: ja_frontdesk_transactionHistory,
      },
      label: ja_label,
      layout: ja_layout,
      onboarding: {
        forgotPassword: ja_onboarding_forgotPassword,
        login: ja_onboarding_login,
        resetPassword: ja_onboarding_resetPassword,
        signup: ja_onboarding_signup,
        slide: ja_onboarding_slide,
        ...ja_onboarding_index,
      },
      settings: {
        account: ja_settings_account,
        deviceSessions: ja_settings_deviceSessions,
        logout: ja_settings_logout,
        notificationsPrivacy: ja_settings_notificationsPrivacy,
        profile: ja_settings_profile,
        ...ja_settings_index,
      },
      store_manager: {
        createStore: ja_store_manager_createStore,
        dashboard: ja_store_manager_dashboard,
        detail: ja_store_manager_detail,
        detailEdit: ja_store_manager_detailEdit,
        qr: ja_store_manager_qr,
        qrConfigure: ja_store_manager_qrConfigure,
        reward: ja_store_manager_reward,
        rewardForm: ja_store_manager_rewardForm,
        rewardView: ja_store_manager_rewardView,
        staff: ja_store_manager_staff,
        staffForm: ja_store_manager_staffForm,
        stamp: ja_store_manager_stamp,
        stampConfigure: ja_store_manager_stampConfigure,
        storeTypes: ja_store_manager_storeTypes,
        stores: ja_store_manager_stores,
        streak: ja_store_manager_streak,
        streakConfigure: ja_store_manager_streakConfigure,
        subscription: ja_store_manager_subscription,
        tabs: ja_store_manager_tabs,
        transactions: ja_store_manager_transactions,
        viewStore: ja_store_manager_viewStore,
      },
      // Back-compat alias: app screens use `storeManager.*` keys.
      storeManager: {
        createStore: ja_store_manager_createStore,
        dashboard: ja_store_manager_dashboard,
        detail: ja_store_manager_detail,
        detailEdit: ja_store_manager_detailEdit,
        qr: ja_store_manager_qr,
        qrConfigure: ja_store_manager_qrConfigure,
        reward: ja_store_manager_reward,
        rewardForm: ja_store_manager_rewardForm,
        rewardView: ja_store_manager_rewardView,
        staff: ja_store_manager_staff,
        staffForm: ja_store_manager_staffForm,
        stamp: ja_store_manager_stamp,
        stampConfigure: ja_store_manager_stampConfigure,
        storeTypes: ja_store_manager_storeTypes,
        stores: ja_store_manager_stores,
        streak: ja_store_manager_streak,
        streakConfigure: ja_store_manager_streakConfigure,
        subscription: ja_store_manager_subscription,
        tabs: ja_store_manager_tabs,
        transactions: ja_store_manager_transactions,
        viewStore: ja_store_manager_viewStore,
      },
      super_admin: {
        dashboard: ja_super_admin_dashboard,
        stores: ja_super_admin_stores,
        subscription: ja_super_admin_subscription,
        users: ja_super_admin_users,
      },
      superAdmin: {
        dashboard: ja_super_admin_dashboard,
        stores: ja_super_admin_stores,
        subscription: ja_super_admin_subscription,
        users: ja_super_admin_users,
      },
      user: {
        activity: ja_user_activity,
        discover: ja_user_discover,
        qr: ja_user_qr,
        rewards: ja_user_rewards,
      },
    }
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default, will be overridden by the Zustand store
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;
