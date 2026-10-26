import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    period?: string;
  };
  badgeText?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  badgeText,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100/90 p-5 shadow-sm hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
      {/* Top row: Icon, Title, and Trend badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 shadow-sm flex-shrink-0">
            {icon}
          </div>
          <span className="text-xs font-semibold text-slate-500 tracking-wide">
            {title}
          </span>
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              trend.isPositive !== false
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {trend.isPositive !== false ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}

        {badgeText && !trend && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            {badgeText}
          </span>
        )}
      </div>

      {/* Value & Subtitle */}
      <div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
