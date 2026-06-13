/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer ships native-ish deps (fontkit, etc.) that must run as a
  // real Node module in route handlers rather than be bundled by the compiler.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
