import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gymma Hemma",
    short_name: "Gymma",
    description: "Logga och planera träningspass i hemmagymmet",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0e10",
    theme_color: "#0d0e10",
    lang: "sv",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
