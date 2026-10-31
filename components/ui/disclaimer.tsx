/** Small print under a field, e.g. "*Custom categories are only visible to you." */
export function Disclaimer({ disclaimerText }: { disclaimerText: string }) {
  return <p className="text-sidebar-ring text-[10px]">{disclaimerText}</p>
}
