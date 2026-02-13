

export const signUp = async ( email: string, username: string, password: string) => {
	try {
		// const userCredential = await createUserWithEmailAndPassword(
		// 	auth,
		// 	email,
		// 	password
		// );

		// const user = userCredential.user;
		// console.log(user)
		// await setDoc(doc(db, "users", userCredential.user.uid), {
		// 	email: email,
		// 	username: username
		// })
	} catch (error) {
		console.error("❌ Signup failed:", error);
	}
}