"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { getNavigationForRole } from "@/lib/navigation";
import {
  LogOut,
  User,
  Settings,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isMobile, setOpenMobile } = useSidebar();
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  const pendingOpportunities = useQuery(
    api.matching.queries.getFreelancerMatches,
    user?.role === "freelancer" && user?._id
      ? { freelancerId: user._id, status: "pending", userId: user._id }
      : "skip"
  );

  const navigationItems = React.useMemo(() => {
    if (!user) return [];
    const items = getNavigationForRole(user.role);
    const opportunityCount =
      user.role === "freelancer" && pendingOpportunities
        ? pendingOpportunities.length
        : 0;
    return items.map((item) =>
      item.title === "Opportunities" && opportunityCount > 0
        ? { ...item, badge: opportunityCount }
        : item
    );
  }, [user, pendingOpportunities]);

  const handleLogout = () => {
    // Clear auth state
    useAuthStore.getState().logout();
    // Clear session tokens
    localStorage.removeItem("sessionToken");
    // Redirect to login
    router.push("/login");
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const closeMobileSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  const iconColorMap: Record<string, string> = {
    Dashboard: "text-indigo-500",
    Projects: "text-emerald-500",
    "Create Project": "text-amber-500",
    Opportunities: "text-amber-500",
    Messages: "text-sky-500",
    Transactions: "text-green-500",
    Disputes: "text-rose-500",
    "Dispute Management": "text-rose-500",
    Users: "text-violet-500",
    Notifications: "text-orange-500",
    Analytics: "text-cyan-500",
    "Audit Logs": "text-slate-500",
    Profile: "text-blue-500",
    Settings: "text-zinc-500",
    "Help & Support": "text-teal-500",
    "All Projects": "text-emerald-500",
    Active: "text-emerald-500",
    Completed: "text-emerald-500",
  };

  const getIconClass = (title: string, isActive: boolean) =>
    cn(
      "transition-transform duration-200 group-hover/menu-item:-translate-y-0.5 group-hover/menu-item:scale-110",
      isActive ? "text-primary" : iconColorMap[title] || "text-muted-foreground"
    );

  if (!user) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant="inset" className="bg-background">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" onClick={closeMobileSidebar} className="flex items-center gap-3">
                <Image
                  key={logoSrc}
                  src={logoSrc}
                  alt="49GIG"
                  width={180}
                  height={60}
                  className="h-10 w-auto shrink-0 object-contain object-left"
                  priority
                />
                <div className={cn(
                  "grid flex-1 text-left text-sm leading-tight min-w-0",
                  "group-data-[collapsible=icon]:hidden"
                )}>
                  <span className="truncate font-semibold">49GIG</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Freelance Marketplace
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="scrollbar-hide">
        {navigationItems.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
          const Icon = item.icon;

          if (item.children && item.children.length > 0) {
            return (
              <SidebarGroup key={item.url}>
                <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = pathname === child.url;
                      return (
                        <SidebarMenuItem key={child.url}>
                          <SidebarMenuButton
                            asChild
                            isActive={isChildActive}
                            tooltip={child.title}
                          >
                            <Link href={child.url} onClick={closeMobileSidebar}>
                              <ChildIcon className={getIconClass(child.title, isChildActive)} />
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <SidebarGroup key={item.url}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url} onClick={closeMobileSidebar}>
                        <Icon className={getIconClass(item.title, isActive)} />
                        <span>{item.title}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={user.profile?.portfolioUrl} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src={user.profile?.portfolioUrl} alt={user.name} />
                      <AvatarFallback className="rounded-lg">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                      <span className="truncate text-xs text-muted-foreground capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}


