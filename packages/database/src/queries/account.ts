import { db } from "../client";

export async function findUserChatsWithMessages(userId: string) {
	return db.chat.findMany({
		where: { userId },
		include: { messages: true },
	});
}
