import {
	deleteUser,
	findUserChatsWithMessages,
	findUserForExport,
	updateUser,
} from "@onecontext/database/queries";

export async function updateProfile(
	userId: string,
	data: { name?: string; profileSummary?: string },
) {
	const updateData: Record<string, string> = {};
	if (data.name !== undefined) updateData.name = data.name;
	if (data.profileSummary !== undefined)
		updateData.profileSummary = data.profileSummary;

	if (Object.keys(updateData).length === 0) {
		return { error: "No fields to update" as const };
	}

	const updated = await updateUser(userId, updateData);
	return {
		name: updated.name,
		email: updated.email,
		profileSummary: updated.profileSummary,
	};
}

export async function updateSyncSettings(userId: string, syncEnabled: boolean) {
	const updated = await updateUser(userId, { syncEnabled });
	return { syncEnabled: updated.syncEnabled };
}

export async function exportUserData(userId: string) {
	const [profile, chats] = await Promise.all([
		findUserForExport(userId),
		findUserChatsWithMessages(userId),
	]);

	return {
		exportedAt: new Date().toISOString(),
		profile,
		chats,
	};
}

export async function deleteAccount(userId: string) {
	await deleteUser(userId);
}
