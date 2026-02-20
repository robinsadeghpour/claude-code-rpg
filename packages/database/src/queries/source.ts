import { db } from "../client";

export async function findSourcesByUserId(userId: string) {
	return db.source.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function findSourcesSummaryByUserId(userId: string) {
	return db.source.findMany({
		where: { userId },
		select: {
			provider: true,
			status: true,
			memoryCount: true,
		},
	});
}
