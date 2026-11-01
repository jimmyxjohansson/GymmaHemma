import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skriv inga lint-fel som stoppar bygget på Vercel; typkontroll körs fortfarande.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
