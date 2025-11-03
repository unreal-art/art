const config = {
  appName: "Unreal",
  appDescription: "AI media geneartion tool",
  domainName:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://art.ideomind.org",
}

export default config
