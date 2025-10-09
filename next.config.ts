/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "magical-tulumba-581427.netlify.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "breadtrans.netlify.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // <— Cho phép tất cả subdomain
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/**",
      },
      {
        protocol: "https",
        hostname: "*.netlify.app",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
