import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_API_URL!,
  process.env.EXPO_PUBLIC_SERVICE_ROLE_KEY!
);

export const createStoreStaff = async ( storeId: string, name: string, email: string, password: string ) => {
  try {
		const { data, error } = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: { name },
		});
	
		if (error) throw error;
	
		const userId = data.user.id;
	
		const { data: existingUser, error: existingUserError } = await supabase
			.from("users")
			.select("id, email, name")
			.eq("id", userId)
			.single();
	
		if (existingUserError) throw existingUserError;
	
		const { data: roleData, error: roleError } = await supabase
		.from("roles")
		.select("id")
		.eq("role_type", "front_desk")
		.limit(1)
		.maybeSingle();
	
		if (roleError || !roleData) {
			throw roleError ?? new Error("Could not find frontdesk role.");
		}
	
		const { data: storeStaffData, error: storeStaffError } = await supabase
			.from("store_staff")
			.insert({
				store_id: storeId,
				user_id: userId,
				role_id: roleData.id,
			})
			.select()
			.single();
	
		if (storeStaffError) throw storeStaffError;
	
		return { userData: existingUser, storeStaffData };
	} catch (error) {
		throw error;
	}
};