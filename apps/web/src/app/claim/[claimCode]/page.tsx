import { notFound } from "next/navigation";
import { services } from "@/lib/server";
import { ClaimPage } from "@/components/claim-page";
export default async function Claim({
  params,
}: {
  params: Promise<{ claimCode: string }>;
}) {
  const { claimCode } = await params;
  const drop = await (await services()).claimService.resolveCode(claimCode);
  if (!drop) notFound();
  return (
    <ClaimPage
      drop={drop}
      path={"/claim/" + claimCode}
      code={claimCode}
      type="QR"
    />
  );
}
