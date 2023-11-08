export default defineNuxtConfig({
    app: {
      cdnURL: 'https://y7sllzb2hyxilfzl5g26cpzf6a0soluc.lambda-url.ap-northeast-1.on.aws/',
      head: {
        title: "Title of your website",
        htmlAttrs: {
          lang: "en",
        },
        meta: [
          { charset: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { hid: "description", name: "description", content: "" },
          { name: "format-detection", content: "telephone=no" },
        ],
      },
    },
  
    devtools: { enabled: true },
  
    nitro: {
      preset: "aws-lambda",
      inlineDynamicImports: true,
      serveStatic: true,
    },  
  });