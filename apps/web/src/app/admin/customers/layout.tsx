export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full min-h-[calc(100vh-3rem)]">
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
