/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@uiw/react-codemirror",
    "@codemirror/lang-javascript",
    "@codemirror/lang-python",
    "@codemirror/lang-cpp",
  ],
};

module.exports = nextConfig;
