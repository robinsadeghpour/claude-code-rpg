import { config } from "@onecontext/config";
import { findUserPlan, upsertApiUsage } from "@onecontext/database/queries";

export function getPlanLimits(plan: string) {
	const planConfig = config.payments.plans[plan] ?? config.payments.plans.free;
	return planConfig.limits;
}

export async function checkMemoryLimit(
	userId: string,
	currentCount: number,
): Promise<{ allowed: boolean; current: number; limit: number | "unlimited" }> {
	const user = await findUserPlan(userId);
	const limits = getPlanLimits(user?.plan ?? "free");

	if (limits.memories === "unlimited") {
		return { allowed: true, current: currentCount, limit: "unlimited" };
	}

	return {
		allowed: currentCount < limits.memories,
		current: currentCount,
		limit: limits.memories,
	};
}

export async function trackApiCall(userId: string): Promise<{
	allowed: boolean;
	remaining: number;
	limit: number | "unlimited";
}> {
	const user = await findUserPlan(userId);
	const limits = getPlanLimits(user?.plan ?? "free");

	if (limits.apiCallsPerDay === "unlimited") {
		return {
			allowed: true,
			remaining: Number.POSITIVE_INFINITY,
			limit: "unlimited",
		};
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const usage = await upsertApiUsage(userId, today);

	const remaining = limits.apiCallsPerDay - usage.callCount;
	return {
		allowed: remaining >= 0,
		remaining: Math.max(0, remaining),
		limit: limits.apiCallsPerDay,
	};
}
