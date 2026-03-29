// app/layout.js
export const metadata = {
  title: 'AlphaLens AI — Institutional Research Terminal',
  description: 'AI-powered stock research, portfolio analysis, and market insights',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
