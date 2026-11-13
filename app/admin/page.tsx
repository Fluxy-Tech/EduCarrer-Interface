import { redirect } from "next/navigation"

// /admin abre direto o gerenciamento de vagas
export default function AdminPage() {
  redirect("/admin/vagas")
}
