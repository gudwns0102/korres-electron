import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import type { AxiosInstance } from "axios";
import { app, BrowserWindow, ipcMain, Notification, session, shell } from "electron";
import type { FastifyInstance } from "fastify";
import path, { join } from "path";
import icon from "../../resources/icon.png?asset";

let mainWindow: BrowserWindow;

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("korres", process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient("korres");
}

app.on("open-url", (__, url) => {
  const urlObject = new URL(url);

  if (urlObject.protocol === "korres:" && urlObject.searchParams.has("data")) {
    const data = JSON.parse(urlObject.searchParams.get("data")!);

    if (mainWindow) {
      mainWindow.webContents.send("kakao-login-done", data);
    }
  }
});

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      webSecurity: false
    }
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    console.log(details);
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.webContents.once("did-finish-load", () => {
    const Axios = require("axios");
    const Fastify = require("fastify");
    const fastify: FastifyInstance = Fastify({});
    const axios: AxiosInstance = Axios.create({});

    fastify.get("/", async (request, reply) => {
      const { code } = request.query as any;

      try {
        const response = await axios.post(
          "https://kauth.kakao.com/oauth/token",
          {
            grant_type: "authorization_code",
            client_id: "8aa1c2976d9ae39d730c75ba97629117",
            redirect_uri: "http://localhost:8888",
            code
          },
          {
            headers: {
              "Content-type": "application/x-www-form-urlencoded",
              Charset: "UTF-8"
            }
          }
        );

        const accessToken = response.data.access_token;

        await axios.post(
          "https://kapi.kakao.com/v2/api/talk/memo/default/send",
          `template_object={
        "object_type": "text",
        "text": "로그인 완료",
        "link": {
            "web_url": "https://developers.kakao.com",
            "mobile_web_url": "https://developers.kakao.com"
        },
        "button_title": "바로 확인"
    }`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-type": "application/x-www-form-urlencoded",
              Charset: "UTF-8"
            }
          }
        );

        reply.redirect("korres://?data=" + JSON.stringify(response.data));
      } catch (error) {
        console.log((error as any).response);
        reply.send("fail");
      }
    });

    fastify.listen({ port: 8888 });
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = "";
    details.requestHeaders["Referer"] = "";
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ["https://smart.letskorail.com/*"] },
    (details, callback) => {
      if (
        details.responseHeaders &&
        details.responseHeaders["Set-Cookie"] &&
        details.responseHeaders["Set-Cookie"].length &&
        !details.responseHeaders["Set-Cookie"][0].includes("SameSite=none")
      ) {
        details.responseHeaders["Set-Cookie"][0] =
          details.responseHeaders["Set-Cookie"][0] + "; SameSite=none; Secure=false;";
      }
      callback({ cancel: false, responseHeaders: details.responseHeaders });
    }
  );

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ["*://*/*"] },
    (details, callback) => {
      if (details.responseHeaders) {
        if (details.responseHeaders["X-Frame-Options"]) {
          delete details.responseHeaders["X-Frame-Options"];
        } else if (details.responseHeaders["x-frame-options"]) {
          delete details.responseHeaders["x-frame-options"];
        }
      }

      callback({ cancel: false, responseHeaders: details.responseHeaders });
    }
  );

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.on("show-notification", (__, title, body) => {
  const notification = new Notification({ title, body });
  notification.show();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
