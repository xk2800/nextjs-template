import updatesData from '@/data/changelog.json';

interface Update {
  version: string;
  date: string;
  changes: string[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Ensure consistent date parsing
  });
}

export default function UpdatesPage() {
  const allUpdates = updatesData as Update[];

  return (
    // You can wrap this in your main layout component if you have one
    <div className="min-h-screen bg-gradient-to-br p-4 mx-auto py-10 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 border-b pb-6">
          <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            All the latest features, improvements, and bug fixes.
          </p>
        </header>

        <div className="space-y-12">
          {/* 5. Map over ALL updates */}
          {allUpdates.map((update) => (
            <article key={update.version}>
              {/* Version and Date */}
              <h2 className="text-2xl font-semibold">
                v{update.version}
              </h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {formatDate(update.date)}
              </p>

              {/* Changes List */}
              <ul className="list-disc space-y-2 pl-5">
                {update.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}