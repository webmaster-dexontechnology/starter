export default defineNuxtConfig({
    app: {
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
      preset: 'aws-lambda',
      inlineDynamicImports: true,
    },  
  });