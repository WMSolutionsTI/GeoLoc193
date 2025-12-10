export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-900">
      <div className="absolute inset-0 bg-[url('/fire-pattern. svg')] opacity-10 pointer-events-none" />
      {children}
    </div>
  );
}