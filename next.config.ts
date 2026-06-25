import type { NextConfig } from "next";

import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
};

export default withEve(nextConfig, { eveRoot: "./src/agent", eveBuildCommand: "node scripts/build-eve.js" });
