'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, PlusCircle, SlidersHorizontal, GitCompareArrows } from 'lucide-react'

const links = [
  { href: '/',         label: 'Dashboard',  Icon: Home               },
  { href: '/listings', label: 'Listings',   Icon: List               },
  { href: '/compare',  label: 'Compare',    Icon: GitCompareArrows   },
  { href: '/criteria', label: 'Criteria',   Icon: SlidersHorizontal  },
  { href: '/add',      label: 'Add',        Icon: PlusCircle         },
]

export default function Nav() {
  const path = usePathname()

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden sm:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-30">
        <span className="font-bold text-gray-900 tracking-tight">SG Property Hunt</span>
        <nav className="flex gap-1">
          {links.map(({ href, label, Icon }) => {
            const active = path === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-30">
        {links.map(({ href, label, Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Mobile bottom padding so content isn't hidden behind nav */}
      <div className="sm:hidden h-16" aria-hidden />
    </>
  )
}
