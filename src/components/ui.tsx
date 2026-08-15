import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-2xl bg-white shadow-sm border border-amber-100 p-5 ${className}`}>{children}</div>
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'warm'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  warm: 'bg-amber-400 text-amber-950 hover:bg-amber-500',
}

export function Button({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  )
}

export function Badge({ children, tone = 'brand' }: PropsWithChildren<{ tone?: 'brand' | 'amber' | 'slate' }>) {
  const toneClasses = {
    brand: 'bg-brand-100 text-brand-700',
    amber: 'bg-amber-100 text-amber-800',
    slate: 'bg-slate-100 text-slate-600',
  }[tone]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses}`}>{children}</span>
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-slate-400 italic py-6 text-center">{message}</p>
}
