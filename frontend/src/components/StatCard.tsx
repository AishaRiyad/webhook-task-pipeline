import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "pink" | "blue" | "green" | "yellow" | "purple" | "red";
};

export default function StatCard({ title, value, icon: Icon, tone = "pink" }: Props) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div>
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
    </div>
  );
}