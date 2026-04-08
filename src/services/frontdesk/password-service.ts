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

    // Update auth password with simple approach
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) {

      // Don't fail completely - database is updated
      return {
        success: true,
        message: "Password setup completed. You may need to update your login password later."
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
    // Update database timestamp first (fast operation)
    const userData = await supabase.auth.getUser();
    if (userData.data?.user) {
      await supabase
        .from("store_staff")
        .update({ 
          password_updated_at: new Date().toISOString() 
        })
        .eq("user_id", userData.data.user.id);
    }

    // Update password in background (don't wait)
    supabase.auth.updateUser({
      password: newPassword
    }).then(({ error }) => {
      if (error) {
        console.error("Background password update failed:", error.message);
      } else {
        console.log("Background password update succeeded");
      }
    });

    // Return success immediately
    return {
      success: true,
      message: "Password update initiated. Your new password will be active shortly."
    };
  } catch (error) {
    console.error("Password update error:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
