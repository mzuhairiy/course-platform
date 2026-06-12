import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1115",
        color: "#ffffff",
      }}
    >
      <div style={{ fontSize: 80, fontWeight: 700 }}>{siteConfig.name}</div>
      <div style={{ fontSize: 32, color: "#9aa0aa", marginTop: 12 }}>
        Belajar skill baru, sesuai kecepatanmu
      </div>
    </div>,
    { ...size },
  );
}
