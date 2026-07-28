export const AppLoadingSkeleton = () => (
  <div className="min-h-screen bg-[#f4f8ff] lg:pl-[256px]">
    <aside className="fixed inset-y-0 left-0 hidden w-[256px] border-r border-blue-100 bg-white p-6 lg:block">
      <div className="h-10 w-36 animate-pulse rounded-lg bg-blue-200" />
      <div className="mt-8 h-11 animate-pulse rounded-lg bg-blue-600/80" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-10 animate-pulse rounded-lg bg-blue-50" />
        ))}
      </div>
    </aside>
    <main className="pt-[60px]">
      <div className="fixed inset-x-0 top-0 z-10 h-[60px] border-b border-blue-100 bg-white/95 lg:left-[256px]">
        <div className="ml-6 mt-4 h-7 w-64 animate-pulse rounded-full bg-blue-100" />
      </div>
      <div className="mx-auto max-w-[1480px] p-5 sm:p-7">
        <div className="h-8 w-56 animate-pulse rounded-md bg-blue-200" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-blue-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50"
            />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-xl border border-blue-100 bg-white" />
      </div>
    </main>
  </div>
);
