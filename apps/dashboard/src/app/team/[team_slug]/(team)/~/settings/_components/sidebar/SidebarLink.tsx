"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarLink(props: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <Button asChild variant="ghost">
      <Link
        href={props.href}
        onClick={props.onClick}
        className={cn(
          "w-full text-muted-foreground text-left !justify-start font-normal",
          pathname === props.href && "text-foreground",
        )}
      >
        {props.label}
      </Link>
    </Button>
  );
}