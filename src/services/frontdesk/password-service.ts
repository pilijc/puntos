import { supabase } from "@/supabase/supabase";
import type { PasswordSetupResponse } from "@/type/frontdesk/password";

export async function checkPasswordSetupRequired(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("store_staff")
      .select("password_updated_at")
      .eq("user_id", userId)
      .single();

    if (error) {
      return true;
    }
    
    // If password_updated_at is null, setup is required
    return !data?.password_updated_at;
  } catch (error) {
    return true;
  }
}

export async function setupInitialPassword(
  userId: string, 
  newPassword: string
): Promise<PasswordSetupResponse> {
  try {
    // Update auth password first
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) {
      return {
        success: false,
        message: `Auth error: ${authError.message}`
      };
    }

    // Only update database after successful auth update
    const { data, error } = await supabase
      .from("store_staff")
      .update({ 
        password_updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .select();

    if (error) {
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: "Staff record not found. Please contact support."
      };
    }

    return {
      success: true,
      message: "Password set successfully!"
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<PasswordSetupResponse> {
  try {
    // Update auth password first and await result
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) {
      return {
        success: false,
        message: `Auth error: ${authError.message}`
      };
    }

    // Only update database timestamp after successful auth update
    const userData = await supabase.auth.getUser();
    if (userData.data?.user) {
      const { error: dbError } = await supabase
        .from("store_staff")
        .update({ 
          password_updated_at: new Date().toISOString() 
        })
        .eq("user_id", userData.data.user.id);

      if (dbError) {
        console.error("Database timestamp update failed:", dbError.message);
        // Don't fail - auth update succeeded
      }
    }

    return {
      success: true,
      message: "Password updated successfully!"
    };
  } catch (error) {
    console.error("Password update error:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
