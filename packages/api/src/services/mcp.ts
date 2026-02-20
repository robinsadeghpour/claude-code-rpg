import { findUserById } from "@onecontext/database/queries";

export async function getUserProfile(userId: string) {
	const user = await findUserById(userId);
	if (!user) return null;

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		username: user.username ?? null,
		image: user.image,
	};
}

export async function getUserProfileSummary(userId: string) {
	const user = await findUserById(userId);

	return {
		name: user?.name,
		email: user?.email,
		username: user?.username ?? null,
	};
}
