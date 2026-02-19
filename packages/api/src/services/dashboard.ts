interface DashboardUser {
	id: string;
	name: string;
	email: string;
	image?: string | null;
}

export async function getDashboardData(user: DashboardUser) {
	return {
		user: {
			name: user.name,
			email: user.email,
			image: user.image,
		},
		stats: {},
	};
}
