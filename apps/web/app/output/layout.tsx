export default function OutputLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black overflow-hidden">{children}</body>
    </html>
  )
}
