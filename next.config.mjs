/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.texaslottery.com",
        pathname: "/export/sites/lottery/Images/scratchoffs/**",
      },
    ],
  },
};

export default nextConfig;
