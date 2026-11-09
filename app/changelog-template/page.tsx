import updatesData from "@/data/changelog-template.json"
import { ChangelogView, type ChangelogEntry } from "@/components/changelog/changelog-view"

export default function ChangelogTemplatePage() {
  return <ChangelogView entries={updatesData as ChangelogEntry[]} />
}
