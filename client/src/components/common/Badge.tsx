import React from "react";

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "dark";
  size?: "sm" | "md";
}> = ({ children, variant = "neutral", size = "sm" }) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    info: "bg-sky-50 text-sky-700 border-sky-100",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    dark: "bg-slate-900 text-white border-transparent",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-[11px] font-semibold",
    md: "px-3 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};

export default Badge;
