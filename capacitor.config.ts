import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.ideomind.org",
  appName: "unreal",
  webDir: "public",
  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: ["ideomind.org"]
  }
};

export default config;
