export default function StudioLogo() {
  return (
    // Sanity renders this inside its own navigation shell, outside Next Image's layout.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/quitrx-logo-white.png"
      alt="QuitRx"
      style={{ display: "block", width: 112, height: 32, objectFit: "contain" }}
    />
  );
}
