import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  UserSquare2,
  Gift,
  Package,
  Boxes,
  CalendarDays,
  Truck,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Shield,
  LogOut,
} from "lucide-react";
import { Can } from "@/components/Can";
import { useAuth } from "@/contexts/auth-context";

type Props = { collapsed?: boolean; onToggle?: () => void };

const itemBase =
  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100";
const itemActive =
  "text-slate-900 bg-slate-100 before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1.5 before:rounded-full before:bg-emerald-500";

export function Sidebar({ collapsed = false, onToggle }: Props) {
  const { logout, user } = useAuth();

  return (
    <div className="h-full flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-3 py-3">
        {!collapsed && (
          <span className="text-sm font-medium text-slate-500">Navegação</span>
        )}
        <button
          aria-label="Alternar sidebar"
          onClick={onToggle}
          className="size-8 inline-flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </div>

      <nav className="px-3 pb-6 overflow-y-auto">
        <Section title="GERAL" collapsed={collapsed}>
          <Item
            to="/"
            icon={<LayoutGrid className="size-4" />}
            text="Dashboard"
            end
            collapsed={collapsed}
          />
        </Section>

        <Section title="DADOS" collapsed={collapsed}>
          <Item
            to="/beneficiaries"
            icon={<Users className="size-4" />}
            text="Beneficiários"
            collapsed={collapsed}
          />
          <Item
            to="/families"
            icon={<UserSquare2 className="size-4" />}
            text="Famílias"
            collapsed={collapsed}
          />
          <Item
            to="/donors"
            icon={<Gift className="size-4" />}
            text="Doadores"
            collapsed={collapsed}
          />
          <Item
            to="/items"
            icon={<Package className="size-4" />}
            text="Artigos"
            collapsed={collapsed}
          />
          <Item
            to="/inventory"
            icon={<Boxes className="size-4" />}
            text="Inventário"
            collapsed={collapsed}
          />
        </Section>

        <Section title="OPERAÇÕES" collapsed={collapsed}>
          <Item
            to="/donations"
            icon={<Gift className="size-4" />}
            text="Doações"
            collapsed={collapsed}
          />
          <Item
            to="/schedules"
            icon={<CalendarDays className="size-4" />}
            text="Agendamentos"
            collapsed={collapsed}
          />
          <Item
            to="/deliveries"
            icon={<Truck className="size-4" />}
            text="Entregas"
            collapsed={collapsed}
          />
        </Section>

        <Section title="ANÁLISE" collapsed={collapsed}>
          <Item
            to="/reports"
            icon={<BarChart3 className="size-4" />}
            text="Relatórios"
            collapsed={collapsed}
          />
        </Section>

        <Can perm="users:read">
          <Section title="ADMINISTRAÇÃO" collapsed={collapsed}>
            <Item
              to="/users"
              icon={<Shield className="size-4" />}
              text="Utilizadores"
              collapsed={collapsed}
            />
          </Section>
        </Can>
      </nav>

      {/* Rodapé: utilizador + logout */}
      <div className="mt-auto p-3 border-t border-slate-200">
        <button
          onClick={logout}
          className={`${itemBase} w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="size-4 text-slate-500" />
          {!collapsed && (
            <span>Terminar sessão{user ? ` (${user.name})` : ""}</span>
          )}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  collapsed,
}: React.PropsWithChildren<{ title: string; collapsed: boolean }>) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 px-2 mb-1">
          {title}
        </div>
      )}
      <div className="grid gap-1">{children}</div>
    </div>
  );
}

function Item({
  to,
  icon,
  text,
  end,
  collapsed,
}: {
  to: string;
  icon: React.ReactNode;
  text: string;
  end?: boolean;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? text : undefined}
      className={({ isActive }) =>
        `${itemBase} ${isActive ? itemActive : ""} ${
          collapsed ? "justify-center" : ""
        }`
      }
    >
      <span className="text-slate-500">{icon}</span>
      {!collapsed && <span>{text}</span>}
    </NavLink>
  );
}
