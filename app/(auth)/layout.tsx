import { SampleLog } from '@/components/marketing/SampleLog'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex items-center justify-center px-6 py-16">{children}</div>
      <div className="relative hidden flex-col justify-center overflow-hidden border-l border-line bg-sunk/70 px-14 lg:flex">
        <div className="max-w-md">
          <p className="label">Your log, a few weeks in</p>
          <p className="heading mt-3 text-3xl leading-snug">Every hour, every receipt, and the fix that finally worked.</p>
          <SampleLog className="mt-10 shadow-lift" />
        </div>
      </div>
    </div>
  )
}
