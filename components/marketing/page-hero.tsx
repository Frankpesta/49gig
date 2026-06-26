import { Fragment, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, Home, LucideIcon } from "lucide-react";
import { absoluteUrl, getCanonicalSiteUrl } from "@/lib/seo/site-url";

function breadcrumbSchemaJsonLd(
  breadcrumbs: BreadcrumbItem[],
  pathname: string
): Record<string, unknown> {
  const homeUrl = absoluteUrl("/");
  const leafUrl = absoluteUrl(pathname.startsWith("/") ? pathname : `/${pathname}`);

  const itemListElement: Record<string, unknown>[] = [
    { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
  ];

  let position = 2;
  for (let i = 0; i < breadcrumbs.length; i++) {
    const c = breadcrumbs[i];
    const isLast = i === breadcrumbs.length - 1;
    const href = typeof c.href === "string" && c.href.trim().length > 0 ? c.href.trim() : undefined;
    const item =
      isLast ? leafUrl : href != null ? absoluteUrl(href) : undefined;
    itemListElement.push({
      "@type": "ListItem",
      position: position++,
      name: c.label,
      ...(item != null ? { item } : {}),
    });
  }

  const baseUrl = getCanonicalSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${leafUrl}/#breadcrumb`,
    isPartOf: { "@id": `${baseUrl}/#website` },
    itemListElement,
  };
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface PageHeroProps {
  title: string;
  description?: string;
  badge?: {
    icon?: LucideIcon;
    text: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  /** Right column: image or custom content */
  rightContent?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  /** Set to true for external storage URLs (e.g. Convex) not in next.config images */
  imageUnoptimized?: boolean;
  /** CTA buttons below description */
  actions?: ReactNode;
  className?: string;
  /** Current path for Breadcrumb JSON-LD (e.g. "/hire-talent") when breadcrumbs exist */
  pathname?: string;
}

export function PageHero({
  title,
  description,
  badge,
  breadcrumbs,
  rightContent,
  imageSrc,
  imageAlt,
  imageUnoptimized,
  actions,
  className,
  pathname,
}: PageHeroProps) {
  const breadcrumbsJsonLd =
    breadcrumbs &&
    breadcrumbs.length > 0 &&
    pathname &&
    pathname.startsWith("/")
      ? breadcrumbSchemaJsonLd(breadcrumbs, pathname)
      : null;

  const hasRightCol = !!imageSrc || !!rightContent;

  const textContent = (
    <>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className="mb-6 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-white/45"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition-colors hover:text-white/75"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          {breadcrumbs.map((item, idx) => (
            <span
              key={`${item.label}-${idx}`}
              className="inline-flex items-center gap-1.5"
            >
              <ChevronRight className="h-3.5 w-3.5 text-white/25" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 transition-colors hover:text-white/75"
                >
                  {item.icon && <item.icon className="h-3.5 w-3.5" />}
                  {item.label}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-white/70">
                  {item.icon && <item.icon className="h-3.5 w-3.5" />}
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Badge */}
      {badge && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/75 backdrop-blur-sm">
          {badge.icon && (
            <badge.icon className="h-3.5 w-3.5 text-secondary" />
          )}
          <span>{badge.text}</span>
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
        {title}
      </h1>

      {/* Description */}
      {description && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
          {description}
        </p>
      )}

      {/* Actions */}
      {actions && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </>
  );

  return (
    <Fragment>
      {breadcrumbsJsonLd ? (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbsJsonLd),
          }}
        />
      ) : null}

      <section
        className={cn(
          "relative overflow-hidden border-b border-white/10 bg-[#07122B]",
          className
        )}
      >
        {/* Mesh gradient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/30 blur-[130px] opacity-60" />
          <div className="absolute -bottom-24 right-1/3 h-[400px] w-[400px] rounded-full bg-secondary/25 blur-[110px] opacity-50" />
          <div className="absolute top-1/2 -left-20 h-[280px] w-[280px] -translate-y-1/2 rounded-full bg-primary/20 blur-[90px] opacity-40" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Thin top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
          {hasRightCol ? (
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div>{textContent}</div>

              <div className="hidden lg:block">
                {imageSrc ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl border border-white/10">
                    <Image
                      src={imageSrc}
                      alt={imageAlt ?? title}
                      fill
                      className="object-cover"
                      unoptimized={imageUnoptimized}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#07122B]/40 via-transparent to-transparent" />
                  </div>
                ) : (
                  rightContent
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl">{textContent}</div>
          )}
        </div>
      </section>
    </Fragment>
  );
}
