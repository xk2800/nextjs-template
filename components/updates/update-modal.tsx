'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// 1. Import your new updates data
import changelog from '@/data/changelog.json';

// 2. (Optional but recommended) Define a type for your update object
interface Update {
  version: string;
  date: string;
  changes: string[];
}

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string; // This prop can now override which version is shown
}

export function UpdateModal({ isOpen, onClose, version }: UpdateModalProps) {
  // 3. Find the update to show
  // If a 'version' prop is passed, find that version.
  // Otherwise, default to the *latest* version (the first item in the array).
  const updateToShow: Update | undefined = version
    ? (changelog as Update[]).find((u) => u.version === version)
    : (changelog[0] as Update);

  // If no update is found (e.g., empty JSON or bad version prop), don't render
  if (!updateToShow) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* 4. Use the version from your JSON data */}
          <DialogTitle>🚀 What&#39;s New? (v{updateToShow.version})</DialogTitle>
          <DialogDescription>
            We&#39;ve released some exciting new features and improvements. Here&#39;s a quick rundown.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* 5. Dynamically create the list from your JSON data */}
          <ul className="list-disc space-y-2 pl-5">
            {updateToShow.changes.map((change, index) => (
              <li key={index}>{change}</li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Got It!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}