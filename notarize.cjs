const { notarize } = require("@electron/notarize");
const path = require("path");

notarize({
  appPath: path.resolve(__dirname, "./dist/mac-arm64/korres.app"), // Path to the app
  appleId: "sejong3408@gmail.com", // Login name of your Apple Developer account
  appleIdPassword: "cbfe-rwhl-wulr-jmzs", // App-specific password
  teamId: "MRV3RDV46P" // Team ID for your developer team
});
