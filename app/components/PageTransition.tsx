"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">(
    "enter",
  );
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setTransitionStage("exit");
    }
  }, [pathname]);

  useEffect(() => {
    if (transitionStage === "exit") {
      const t = setTimeout(() => {
        setDisplayChildren(children);
        prevPathname.current = pathname;
        setTransitionStage("enter");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [transitionStage, children, pathname]);

  useEffect(() => {
    if (transitionStage === "enter" && pathname === prevPathname.current) {
      setDisplayChildren(children);
    }
  }, [children, transitionStage, pathname]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        transitionStage === "exit"
          ? "opacity-0 translate-y-4 scale-[0.98]"
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      {displayChildren}
    </div>
  );
}
