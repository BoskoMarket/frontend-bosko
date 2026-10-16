/**
 * Never offer a report on your own content or profile. While the viewer or the author is unknown
 * (profile still loading, author id missing) the option stays hidden: a wrongly hidden entry is
 * harmless, a self-report entry is not.
 */
export function canReport(authorId: string | null | undefined, viewerId: string | null | undefined): boolean {
  if (!authorId || !viewerId) return false;
  return authorId !== viewerId;
}
