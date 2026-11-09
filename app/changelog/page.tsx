import updatesData from "@/data/changelog.json"
import { ChangelogView, type ChangelogEntry } from "@/components/changelog/changelog-view"

export default function ChangelogPage() {
  return <ChangelogView active="changelog" entries={updatesData as ChangelogEntry[]} />
}
