import AnalysisScreen from "./AnalysisScreen";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;

  return <AnalysisScreen id={typeof id === "string" ? id : ""} />;
}
