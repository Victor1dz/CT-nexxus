"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: "Dashboard", href: "/", icon: "speedometer2" },
    { name: "Alunos", href: "/alunos", icon: "people" },
    { name: "Modalidades", href: "/modalidades", icon: "gem" },
    { name: "Horários", href: "/horarios", icon: "clock" },
    { name: "Agenda", href: "/agenda", icon: "calendar-week" },
    { name: "Diário / Presença", href: "/diario", icon: "card-checklist" },
    { name: "Financeiro", href: "/financeiro", icon: "cash-coin" },
  ]

  return (
    <nav className="fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-slate-200 z-50 shadow-[2px_0_10px_rgba(0,0,0,0.03)] flex flex-col pt-6 transition-all duration-300">
      <Link href="/" className="px-6 mb-8 flex flex-col items-center gap-2 text-decoration-none">
        <div className="w-20 h-20 bg-slate-50 rounded-xl shadow-sm flex items-center justify-center p-1">
          {/* Logo placeholder */}
          <div className="w-full h-full bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs">LOGO</div>
        </div>
        <h5 className="m-0 font-bold text-slate-800 tracking-tight text-lg">CT Nexxus</h5>
      </Link>
      
      <ul className="flex flex-col flex-1 list-none p-0 m-0 w-full">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== "/")
          return (
            <li key={link.href} className="w-full">
              <Link 
                href={link.href} 
                className={`flex items-center gap-3 py-3 px-7 w-full transition-all duration-200 border-r-4 ${
                  isActive 
                    ? "text-slate-800 bg-slate-100 border-blue-500 font-semibold" 
                    : "text-slate-500 hover:text-blue-500 hover:bg-slate-50 hover:pl-8 border-transparent font-medium"
                }`}
              >
                <i className={`bi bi-${link.icon} text-lg ${isActive ? "text-blue-500 opacity-100" : "opacity-80"}`}></i>
                {link.name}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto p-4 text-center">
        <small className="text-slate-500">CT Nexxus v2.0 (Next.js)</small>
      </div>
    </nav>
  )
}
