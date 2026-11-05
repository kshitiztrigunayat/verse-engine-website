// A plug-in package's SHA-256 checksum with a Copy button (was the copy-hash part of public/js/pages.js).
import { useState } from "react";

export default function HashRow({ hash, name, buttonId }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setStatus("Checksum copied.");
    } catch {
      setStatus("Select and copy the checksum with your keyboard.");
    }
  }
  return (
    <div className="hash-row">
      <div>
        <span>SHA-256</span>
        <code>{hash}</code>
      </div>
      <button type="button" data-copy-hash="" aria-label={"Copy SHA-256 for " + name} id={buttonId} onClick={copy}>
        Copy ⧉
      </button>
      <span className="hash-status" aria-live="polite">{status}</span>
    </div>
  );
}
