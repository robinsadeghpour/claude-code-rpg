import { db } from "@onecontext/database/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../app";

const DEV_API_KEY = process.env.DEV_API_KEY;
const authHeaders: Record<string, string> = DEV_API_KEY
	? { Authorization: `Bearer ${DEV_API_KEY}` }
	: {};

describe("API Routes", () => {
	describe("Health Check", () => {
		it("should return 200 OK for /api/health", async () => {
			const res = await app.request("/api/health");
			expect(res.status).toBe(200);
			const text = await res.text();
			expect(text).toBe("OK");
		});
	});

	describe("Auth Guards - Protected Endpoints", () => {
		it("should return 401 for GET /api/ai/chats without auth", async () => {
			const res = await app.request("/api/ai/chats");
			expect(res.status).toBe(401);
			const json = await res.json();
			expect(json).toEqual({ error: "Unauthorized" });
		});

		it("should return 401 for POST /api/ai/chat without auth", async () => {
			const res = await app.request("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: [] }),
			});
			expect(res.status).toBe(401);
		});

		it("should return 401 for GET /api/ai/chats/:id without auth", async () => {
			const res = await app.request("/api/ai/chats/fake-id");
			expect(res.status).toBe(401);
		});

		it("should return 401 for DELETE /api/ai/chats/:id without auth", async () => {
			const res = await app.request("/api/ai/chats/fake-id", {
				method: "DELETE",
			});
			expect(res.status).toBe(401);
		});

		it("should return 401 for GET /api/dashboard without auth", async () => {
			const res = await app.request("/api/dashboard");
			expect(res.status).toBe(401);
			const json = await res.json();
			expect(json).toEqual({ error: "Unauthorized" });
		});

		it("should return 401 for PUT /api/settings/profile without auth", async () => {
			const res = await app.request("/api/settings/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Test" }),
			});
			expect(res.status).toBe(401);
		});

		it("should return 401 for PUT /api/settings/sync without auth", async () => {
			const res = await app.request("/api/settings/sync", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ syncEnabled: false }),
			});
			expect(res.status).toBe(401);
		});

		it("should return 401 for GET /api/settings/export without auth", async () => {
			const res = await app.request("/api/settings/export");
			expect(res.status).toBe(401);
		});

		it("should return 401 for DELETE /api/settings/account without auth", async () => {
			const res = await app.request("/api/settings/account", {
				method: "DELETE",
			});
			expect(res.status).toBe(401);
		});

		it("should return 401 for POST /api/ai/chats without auth", async () => {
			const res = await app.request("/api/ai/chats", { method: "POST" });
			expect(res.status).toBe(401);
		});

		it("should return 401 for PATCH /api/ai/chats/:id without auth", async () => {
			const res = await app.request("/api/ai/chats/fake-id", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: "test" }),
			});
			expect(res.status).toBe(401);
		});
	});

	describe.runIf(!!DEV_API_KEY)("Authenticated — Chat CRUD Lifecycle", () => {
		const chatIdsToCleanup: string[] = [];
		let testUserId: string;

		beforeAll(async () => {
			const devUserEmail = process.env.DEV_API_USER_EMAIL ?? "";
			const user = await db.user.findUnique({
				where: { email: devUserEmail },
			});
			if (!user) throw new Error("Test user not found");
			testUserId = user.id;
		});

		afterAll(async () => {
			for (const id of chatIdsToCleanup) {
				await db.chat
					.delete({ where: { id } })
					.catch((err) => console.warn("Cleanup failed for chat", id, err));
			}
		});

		it("should persist a chat with messages and load them back", async () => {
			const chat = await db.chat.create({
				data: { userId: testUserId, title: "Persistence Test" },
			});
			chatIdsToCleanup.push(chat.id);

			await db.chatMessage.create({
				data: {
					chatId: chat.id,
					role: "user",
					parts: [{ type: "text", text: "Hello" }],
				},
			});

			await db.chatMessage.create({
				data: {
					chatId: chat.id,
					role: "assistant",
					parts: [{ type: "text", text: "Hi there!" }],
				},
			});

			const res = await app.request(`/api/ai/chats/${chat.id}`, {
				headers: authHeaders,
			});
			expect(res.status).toBe(200);

			const json = (await res.json()) as {
				id: string;
				title: string;
				messages: Array<{
					id: string;
					role: string;
					parts: Array<{ type: string; text: string }>;
					createdAt: string;
				}>;
			};

			expect(json.id).toBe(chat.id);
			expect(json.title).toBe("Persistence Test");
			expect(json.messages).toHaveLength(2);
			expect(json.messages[0].role).toBe("user");
			expect(json.messages[1].role).toBe("assistant");
		});

		it("should list multiple chats sorted by most recent first", async () => {
			const chat1 = await db.chat.create({
				data: { userId: testUserId, title: "Older Chat" },
			});
			chatIdsToCleanup.push(chat1.id);

			await new Promise((r) => setTimeout(r, 50));

			const chat2 = await db.chat.create({
				data: { userId: testUserId, title: "Newer Chat" },
			});
			chatIdsToCleanup.push(chat2.id);

			const res = await app.request("/api/ai/chats", {
				headers: authHeaders,
			});
			expect(res.status).toBe(200);

			const json = (await res.json()) as Array<{
				id: string;
				title: string;
				updatedAt: string;
			}>;

			const idx1 = json.findIndex((c) => c.id === chat1.id);
			const idx2 = json.findIndex((c) => c.id === chat2.id);
			expect(idx1).toBeGreaterThan(-1);
			expect(idx2).toBeGreaterThan(-1);
			expect(idx2).toBeLessThan(idx1);
		});

		it("should cascade delete messages when chat is deleted", async () => {
			const chat = await db.chat.create({
				data: { userId: testUserId, title: "Cascade Test" },
			});

			const msg = await db.chatMessage.create({
				data: {
					chatId: chat.id,
					role: "user",
					parts: [{ type: "text", text: "Will be cascade deleted" }],
				},
			});

			const deleteRes = await app.request(`/api/ai/chats/${chat.id}`, {
				method: "DELETE",
				headers: authHeaders,
			});
			expect(deleteRes.status).toBe(200);

			const orphanedMsg = await db.chatMessage.findUnique({
				where: { id: msg.id },
			});
			expect(orphanedMsg).toBeNull();
		});

		it("should create a new empty chat via POST /api/ai/chats", async () => {
			const res = await app.request("/api/ai/chats", {
				method: "POST",
				headers: authHeaders,
			});
			expect(res.status).toBe(200);

			const json = (await res.json()) as {
				id: string;
				title: string;
				createdAt: string;
				updatedAt: string;
			};
			expect(json.id).toBeDefined();
			expect(json.title).toBeDefined();

			chatIdsToCleanup.push(json.id);
		});

		it("should update chat title via PATCH /api/ai/chats/:id", async () => {
			const chat = await db.chat.create({
				data: { userId: testUserId, title: "Original Title" },
			});
			chatIdsToCleanup.push(chat.id);

			const res = await app.request(`/api/ai/chats/${chat.id}`, {
				method: "PATCH",
				headers: { ...authHeaders, "Content-Type": "application/json" },
				body: JSON.stringify({ title: "Updated Title" }),
			});
			expect(res.status).toBe(200);

			const json = (await res.json()) as { id: string; title: string };
			expect(json.title).toBe("Updated Title");
		});

		it("should return 404 when getting nonexistent chat", async () => {
			const res = await app.request("/api/ai/chats/nonexistent-id", {
				headers: authHeaders,
			});
			expect(res.status).toBe(404);
			expect(await res.json()).toEqual({ error: "Chat not found" });
		});

		it("should return 404 when deleting nonexistent chat", async () => {
			const res = await app.request("/api/ai/chats/nonexistent-id", {
				method: "DELETE",
				headers: authHeaders,
			});
			expect(res.status).toBe(404);
			expect(await res.json()).toEqual({ error: "Chat not found" });
		});
	});

	describe("Billing — Auth Guards", () => {
		it("should return 401 for POST /api/billing/checkout without auth", async () => {
			const res = await app.request("/api/billing/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ priceId: "price_test" }),
			});
			expect(res.status).toBe(401);
		});

		it("should return 401 for POST /api/billing/portal without auth", async () => {
			const res = await app.request("/api/billing/portal", {
				method: "POST",
			});
			expect(res.status).toBe(401);
		});

		it("should return 401 for GET /api/billing/subscription without auth", async () => {
			const res = await app.request("/api/billing/subscription");
			expect(res.status).toBe(401);
		});

		it("should return 401 for POST /api/billing/cancel without auth", async () => {
			const res = await app.request("/api/billing/cancel", {
				method: "POST",
			});
			expect(res.status).toBe(401);
		});

		it("should return 400 for POST /api/billing/webhook without stripe-signature", async () => {
			const res = await app.request("/api/billing/webhook", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(400);
			const json = await res.json();
			expect(json).toEqual({ error: "Missing stripe-signature header" });
		});
	});

	describe.runIf(!!DEV_API_KEY)("Authenticated — Billing", () => {
		it("should return subscription info with correct shape", async () => {
			const res = await app.request("/api/billing/subscription", {
				headers: authHeaders,
			});
			expect(res.status).toBe(200);

			const json = (await res.json()) as {
				plan: string;
				planId: string;
				isPro: boolean;
				subscription: unknown;
				usage: {
					apiCallsToday: number;
				};
				limits: Record<string, unknown>;
			};

			expect(json.plan).toBeDefined();
			expect(json.planId).toBeDefined();
			expect(typeof json.isPro).toBe("boolean");
			expect(json.usage).toBeDefined();
			expect(typeof json.usage.apiCallsToday).toBe("number");
			expect(json.limits).toBeDefined();
		});

		it("should return 400 for POST /api/billing/checkout without priceId", async () => {
			const res = await app.request("/api/billing/checkout", {
				method: "POST",
				headers: { ...authHeaders, "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(400);
			const json = await res.json();
			expect(json).toEqual({ error: "priceId is required" });
		});

		it("should return 400 for POST /api/billing/portal without stripe customer", async () => {
			const res = await app.request("/api/billing/portal", {
				method: "POST",
				headers: authHeaders,
			});
			expect(res.status).toBe(400);
			const json = await res.json();
			expect(json).toEqual({
				error: "No Stripe customer ID found. Please subscribe first.",
			});
		});

		it("should return 400 for POST /api/billing/cancel without active subscription", async () => {
			const res = await app.request("/api/billing/cancel", {
				method: "POST",
				headers: authHeaders,
			});
			expect(res.status).toBe(400);
			const json = await res.json();
			expect(json).toEqual({ error: "No active subscription found" });
		});
	});

	describe.runIf(!!DEV_API_KEY)("Authenticated — Settings", () => {
		it("should update profile with name and profileSummary", async () => {
			const devUserEmail = process.env.DEV_API_USER_EMAIL ?? "";
			const originalUser = await db.user.findUnique({
				where: { email: devUserEmail },
			});
			if (!originalUser) throw new Error("Test user not found");

			try {
				const res = await app.request("/api/settings/profile", {
					method: "PUT",
					headers: { ...authHeaders, "Content-Type": "application/json" },
					body: JSON.stringify({
						name: "Test User Updated",
						profileSummary: "A test bio",
					}),
				});
				expect(res.status).toBe(200);

				const json = (await res.json()) as {
					name: string;
					email: string;
					profileSummary: string;
				};
				expect(json.name).toBe("Test User Updated");
				expect(json.email).toBeDefined();
				expect(json.profileSummary).toBe("A test bio");
			} finally {
				await db.user.update({
					where: { email: devUserEmail },
					data: { name: originalUser.name },
				});
			}
		});

		it("should return 400 for profile update with empty body", async () => {
			const res = await app.request("/api/settings/profile", {
				method: "PUT",
				headers: { ...authHeaders, "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});
			expect(res.status).toBe(400);
			const json = await res.json();
			expect(json).toEqual({ error: "No fields to update" });
		});

		it("should update sync settings", async () => {
			const res = await app.request("/api/settings/sync", {
				method: "PUT",
				headers: { ...authHeaders, "Content-Type": "application/json" },
				body: JSON.stringify({ syncEnabled: false }),
			});
			expect(res.status).toBe(200);

			const json = (await res.json()) as { syncEnabled: boolean };
			expect(json.syncEnabled).toBe(false);
		});

		it("should export user data with correct shape", async () => {
			const res = await app.request("/api/settings/export", {
				headers: authHeaders,
			});
			expect(res.status).toBe(200);

			const json = (await res.json()) as {
				exportedAt: string;
				profile: unknown;
				chats: unknown;
			};
			expect(json.exportedAt).toBeDefined();
			expect(json.profile).toBeDefined();
			expect(json.chats).toBeDefined();
		});
	});
});
