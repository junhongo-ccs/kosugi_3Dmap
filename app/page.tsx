import MapExplorer from "./MapExplorer";

export default function Home() {
  return <MapExplorer apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} />;
}
