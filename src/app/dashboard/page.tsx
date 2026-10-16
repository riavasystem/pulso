import type { Metadata } from "next";
import Dashboard from "@/features/dashboard/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Pulso+",
  description: "Tu espacio financiero personal. Controla gastos fijos, gastos hormiga e ingresos en un solo lugar.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
