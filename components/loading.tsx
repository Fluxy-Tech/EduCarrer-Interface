"use client"

interface Props {
  loading: boolean,
  message?: string
}

export default function Loading({ loading, message }: Props) {

  if (loading) {
    return (
      <div className="flex fixed items-center bg-ink/55 backdrop-blur-sm justify-center w-full h-full top-0 left-0 z-999 p-6">
        <div className="surface px-8 py-7 max-w-sm text-center flex flex-col items-center gap-4 animate-pop">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-brand-soft" />
            <div className="absolute inset-0 rounded-full border-4 border-brand border-r-transparent animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
          <p className="text-ink text-sm font-medium leading-relaxed">{
            message ?? "Carregando..."
          }</p>
        </div>
      </div>
    )
  } else {
    return;
  }
}
