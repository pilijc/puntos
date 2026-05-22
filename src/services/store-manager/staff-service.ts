import { supabase } from "@/supabase/supabase";

export const getStoreStaff = async (storeId: string) => {
  try {
		const { data, error } = await supabase
			.from("store_staff")
			.select(`
				id,
				store_id,
				role_id,
				created_at,
				user: users (
					id,
					name,
					email
				)
			`)
			.eq("store_id", storeId);

		if (error) throw error;
		return data;
	} catch (error) {
		throw error;
	}
};

export type StoreStaffRow = NonNullable<Awaited<ReturnType<typeof getStoreStaff>>>[number];

export const deleteStoreStaff = async (staffId: string) => {
  try {
    const { error } = await supabase
      .from("store_staff")
      .delete()
      .eq("id", staffId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const createStoreStaff = async ( storeId: string, name: string, email: string, password: string ) => {
  try {
		const { data, error } = await supabase.functions.invoke("create-staff", {
			body: {
				email,
				password,
				name,
			},
		});
	
		if (error) throw error;
		if (!data?.user?.id) {
			throw new Error("Failed to retrieve user details from staff creation function.");
		}
	
		const userId = data.user.id;
	
		const { data: existingUser, error: existingUserError } = await supabase
			.from("users")
			.upsert(
				{
					id: userId,
					email,
					name,
					role: "front_desk",
				},
				{ onConflict: "id" }
			)
			.select("id, email, name")
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

		const { error: userRoleError } = await supabase
			.from("user_roles")
			.insert({
				user_id: userId,
				role_id: roleData.id,
				store_id: storeId,
			});

		if (userRoleError) throw userRoleError;

		const { data: storeStaffData, error: storeStaffError } = await supabase
			.from("store_staff")
			.insert({
				store_id: storeId,
				user_id: userId,
				role_id: roleData.id,
				is_active: true,
				created_at: new Date().toISOString(),
				password_updated_at: null,
			})
			.select()
			.single();
	
		if (storeStaffError) throw storeStaffError;
	
		return { userData: existingUser, storeStaffData };
	} catch (error) {
		throw error;
	}
};

export const getStoreStaffMember = async (staffId: string) => {
  const { data, error } = await supabase
    .from("store_staff")
    .select(`
      id,
      store_id,
      role_id,
      created_at,
      user: users (
        id,
        name,
        email
      )
    `)
    .eq("id", staffId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateStoreStaffMember = async (staffId: string, name: string, email: string) => {
  const staff = await getStoreStaffMember(staffId);
  const user = staff?.user as { id?: string } | null;
  if (!user?.id) throw new Error("Staff user not found.");

  const { error } = await supabase
    .from("users")
    .update({ name, email })
    .eq("id", user.id);

  if (error) throw error;
};