export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
  },
  {
    id: "users",
    label: "Quản lý người dùng",
    href: "/admin/users",
  },
  {
    id: "classes",
    label: "Quản lý lớp học",
    href: "/admin/classes",
  },
  {
    id: "teachers",
    label: "Quản lý giáo viên",
    href: "/admin/teachers",
  },
  {
    id: "students",
    label: "Quản lý học sinh",
    href: "/admin/students",
  },
  {
    id: "currency",
    label: "Quản lý Bánh mì",
    href: "/admin/currency",
  },
];
