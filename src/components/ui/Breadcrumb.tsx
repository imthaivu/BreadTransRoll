import Link from "next/link";
import { FiHome, FiChevronRight } from "react-icons/fi";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-base">
      <ol className="flex flex-wrap items-center gap-2 text-slate-600">
        {items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          const isHomeLike =
            idx === 0 &&
            (it.href === "/" || it.label.toLowerCase().includes("lớp"));
          return (
            <li key={idx} className="flex items-center gap-1">
              {it.href && !isLast ? (
                <Link
                  href={it.href}
                  className="hover:text-primary inline-flex items-center gap-1"
                >
                  {isHomeLike && <FiHome className="text-slate-400" />}
                  {it.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "text-foreground font-medium inline-flex items-center gap-1"
                      : "inline-flex items-center gap-1"
                  }
                >
                  {isHomeLike && <FiHome className="text-slate-400" />}
                  {it.label}
                </span>
              )}
              {!isLast && <FiChevronRight className="text-slate-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
