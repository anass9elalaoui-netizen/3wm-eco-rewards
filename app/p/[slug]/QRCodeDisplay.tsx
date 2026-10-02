"use client";

import { QRCodeCanvas } from "qrcode.react";

interface QRCodeDisplayProps {
  url: string;
}

export default function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  return (
    <div className="bg-gray-900 p-3 rounded-lg inline-block border border-cyan-500/20">
      <QRCodeCanvas
        value={url}
        size={140}
        bgColor="#111827"
        fgColor="#06b6d4"
        level="H"
        includeMargin={false}
      />
    </div>
  );
}
