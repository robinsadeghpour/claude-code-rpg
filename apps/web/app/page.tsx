import Link from "next/link";

export default function HomePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
			<h1 className="text-4xl font-bold tracking-tight">Welcome</h1>
			<p className="text-lg text-muted-foreground">
				Your Next.js boilerplate is ready.
			</p>
			<div className="flex gap-4">
				<Link
					href="/login"
					className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Sign in
				</Link>
				<Link
					href="/signup"
					className="rounded-md border border-border px-6 py-2.5 text-sm font-medium hover:bg-accent"
				>
					Sign up
				</Link>
			</div>
		</main>
	);
}
