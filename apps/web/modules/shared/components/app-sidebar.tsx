"use client";

import { UserMenu } from "@shared/components/user-menu";
import { useSubscription } from "@shared/lib/billing-api";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@ui/components/sidebar";
import { LayoutDashboard, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
	{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ title: "Settings", href: "/settings", icon: Settings },
];

function PlanBadge() {
	const { data: sub } = useSubscription();
	if (!sub) return null;

	if (!sub.isPro) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						asChild
						size="lg"
						className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus-visible:ring-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
					>
						<Link href="/settings/billing">
							<Sparkles className="h-4 w-4" />
							<span className="flex flex-col items-start leading-tight">
								<span className="text-sm font-semibold">Upgrade to Pro</span>
							</span>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					className="border border-primary"
					asChild
					variant="outline"
				>
					<Link href="/settings/billing">
						<span className="flex items-center justify-between">
							<span className="font-medium">Pro Plan</span>
							<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
								Active
							</span>
						</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

interface AppSidebarProps {
	user: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
}

export function AppSidebar({ user }: AppSidebarProps) {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();

	return (
		<Sidebar variant="inset" collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link href="/dashboard" onClick={() => setOpenMobile(false)}>
								<span className="truncate font-semibold">My App</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={pathname.startsWith(item.href)}
									>
										<Link href={item.href} onClick={() => setOpenMobile(false)}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<PlanBadge />
				<UserMenu user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
