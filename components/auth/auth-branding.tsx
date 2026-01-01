export function AuthBranding() {
  return (
    <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">49GIG</div>
            <div className="text-xs text-muted-foreground">Freelance Marketplace</div>
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        © 2025 49GIG. All rights reserved.
      </div>
    </div>
  );
}

export function AuthMobileLogo() {
  return (
    <div className="lg:hidden flex items-center justify-center gap-3 pb-8">
      <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg
          className="size-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      </div>
      <div>
        <div className="text-xl font-bold tracking-tight">49GIG</div>
        <div className="text-xs text-muted-foreground">Freelance Marketplace</div>
      </div>
    </div>
  );
}

