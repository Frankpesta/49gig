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
import { useAuthStore } from "@/stores/authStore";
import { getMenuItems, getGeneralItems, getNavItemTitle } from "@/lib/navigation";
import type { NavItem } from "@/lib/navigation";
import { LogOut, User, Settings, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const { resolvedTheme } = useTheme();
  const isCollapsed = state === "collapsed";

  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  const menuItems = React.useMemo(() => {
    if (!user) return [];
    return getMenuItems(user.role);
  }, [user]);

  const generalItems = React.useMemo(() => {
    if (!user) return [];
    return getGeneralItems(user.role);
  }, [user]);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    localStorage.removeItem("sessionToken");
    router.push("/login");
  };

  const closeMobileSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  const getIconClass = (isActive: boolean) =>
    cn(
      "transition-colors duration-200 shrink-0",
      isActive ? "text-primary-foreground" : "text-muted-foreground"
    );

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const itemTitle = getNavItemTitle(item, user.role);

    if (item.children && item.children.length > 0) {
      return (
        <SidebarGroup key={item.url}>
          <SidebarGroupContent>
            <SidebarMenu>
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const childTitle = getNavItemTitle(child, user.role);
                const isChildActive = pathname === child.url || pathname.startsWith(child.url + "/");
                return (
                  <SidebarMenuItem key={child.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isChildActive}
                      tooltip={childTitle}
                      className={cn(
                        "rounded-lg transition-all duration-200",
                        isChildActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-l-4 border-l-secondary"
                      )}
                    >
                      <Link href={child.url} onClick={closeMobileSidebar} className="relative flex items-center gap-2">
                        {isChildActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-lg bg-primary-foreground/30" />
                        )}
                        <ChildIcon className={getIconClass(isChildActive)} />
                        <span>{childTitle}</span>
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

    const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={itemTitle}
          className={cn(
            "rounded-lg transition-all duration-200",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-l-4 border-l-secondary"
          )}
        >
          <Link href={item.url} onClick={closeMobileSidebar} className="relative flex items-center gap-2">
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-lg bg-primary-foreground/30" />
            )}
            <Icon className={getIconClass(isActive)} />
            <span>{itemTitle}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-semibold">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant="inset" className="bg-sidebar/95 border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/70 bg-sidebar p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" onClick={closeMobileSidebar} className="flex items-center gap-3 rounded-xl px-2 py-2">
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

      <SidebarContent className="scrollbar-hide bg-sidebar flex flex-col gap-1 py-2">
        {/* MENU Section */}
        {menuItems.length > 0 && (
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2 mb-1">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {menuItems.map((item) => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* GENERAL Section */}
        {generalItems.length > 0 && (
          <SidebarGroup className="px-2 mt-2">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2 mb-1">
              General
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {generalItems.map((item) => {
                  const Icon = item.icon;
                  const itemTitle = getNavItemTitle(item, user.role);
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={itemTitle}
                        className={cn(
                          "rounded-lg transition-all duration-200",
                          isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                        )}
                      >
                        <Link href={item.url} onClick={closeMobileSidebar} className="flex items-center gap-2">
                          <Icon className={getIconClass(isActive)} />
                          <span>{itemTitle}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip="Log out"
                    className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Bottom CTA Card - Reference style */}
      <SidebarFooter className="border-t border-sidebar-border/70 p-3 mt-auto">
        <div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-lg">
          {!isCollapsed ? (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold">Need Help?</p>
                <p className="text-xs text-primary-foreground/80 leading-snug">
                  Get support from our team or browse our help center.
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-2 w-full rounded-lg bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <Link href="/dashboard/support" onClick={closeMobileSidebar}>
                    Get Support
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button asChild size="icon" variant="ghost" className="rounded-lg text-primary-foreground hover:bg-primary-foreground/20 size-9">
                <Link href="/dashboard/support" onClick={closeMobileSidebar}>
                  <HelpCircle className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
