// src/config/menu.ts
export const menuItems = [
  {
    label: "Dashboard",
    icon: "Home",
    path: "/dashboard",
    perms: ["view_dashboard"], // permissão genérica
  },
  {
    label: "Leads",
    icon: "UserPlus",
    path: "/leads",
    perms: ["view_lead"], // ex: comercial/admin
  },
  {
    label: "Clientes",
    icon: "Building2",
    path: "/clientes",
    perms: ["view_client"],
    children: [
      {
        label: "Cadastrar Cliente",
        path: "/clientes/novo",
        perms: ["create_client"],
      },
    ],
  },
  {
    label: "Usuários",
    icon: "Users",
    path: "/usuarios",
    perms: ["manage_users"], // só admin vê
  },
  // ... outros itens
];
