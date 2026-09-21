import type { ReactNode } from "react";

export interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

/** Tarjeta de estadística (las 4 tarjetas superiores del dashboard). */
export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
