import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
  centerAction?: React.ReactNode;
}

export function PageHeader({ title, description, className }: HeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h1 className="text-4xl md:text-6xl text-text-primary tracking-tighter">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export function SubHeader({ title, description, className }: HeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h1 className="text-2xl sm:text-4xl text-text-primary tracking-tighter">
        {title}
      </h1>
      {description && (
        <p className="text-sm/6 text-text-secondary">{description}</p>
      )}
    </div>
  );
}

export function PageHeaderWithActions({
  title,
  className,
  actions,
  centerAction,
}: HeaderProps) {
  return (
    <div className={cn("flex gap-4 items-center justify-between", className)}>
      <div className="min-w-0">
        <h2 className="max-w-md text-4xl tracking-tighter text-balance text-left font-normal">
          {title}
        </h2>
      </div>
      <div className="flex flex-1 items-center justify-center">
        {centerAction}
      </div>
      <div className="flex">{actions}</div>
    </div>
  );
}

export function CardHeader({ title, className, actions }: HeaderProps) {
  return (
    <div
      className={cn(
        "flex gap-4 items-center justify-between w-full",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-text-primary truncate">
          {title}
        </h2>
      </div>
      <div className="flex flex-row items-center justify-end gap-2">
        {actions}
      </div>
    </div>
  );
}
