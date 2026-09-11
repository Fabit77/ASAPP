import { notFound } from "next/navigation";
import { services } from "@/lib/server";
import { ClaimPage } from "@/components/claim-page";
export default async function Claim({
  params,
}: {
  params: Promise<{ dropSlug: string }>;
}) {
  const { dropSlug } = await params;
  const drop = await (await services()).claimService.resolveSecret(dropSlug);
  if (!drop) notFound();
  return (
    <ClaimPage
      drop={drop}
      path={"/claim/secret/" + dropSlug}
      type="SECRET_WORD"
    />
  );
}
