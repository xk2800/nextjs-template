'use client';

import { useState, useEffect } from 'react';
import { UpdateModal } from './UpdateModal';

const LOCAL_STORAGE_KEY = 'appUpdateInfo';

export function ModalProvider() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  useEffect(() => {
    // This effect runs only on the client
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION;

    // 1. Get the stored data
    const storedDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const storedData = storedDataRaw ? JSON.parse(storedDataRaw) : null;

    // --- Start of Debugging ---
    console.log("--- Modal Version Check ---");
    console.log("✅ Current App Version:", currentVersion);
    console.log("📦 Stored Data:", storedData);

    if (storedData) {
      console.log(`Comparison: '${storedData.version}' !== '${currentVersion}' is ${storedData.version !== currentVersion}`);
    }
    // --- End of Debugging ---

    if (!storedData || storedData.version !== currentVersion) {
      console.log("➡️ Decision: Show modal.");
      setIsModalOpen(true);
    } else {
      console.log("➡️ Decision: Do not show modal.");
    }

    // 2. Decide whether to show the modal
    // Show if there's no data or if the stored version doesn't match the current version
    if (!storedData || storedData.version !== currentVersion) {
      setIsModalOpen(true);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  const handleClose = () => {
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION;

    // Save the current version to localStorage when the user closes the modal
    const dataToStore = {
      version: currentVersion,
      closed: true,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));

    // Close the modal
    setIsModalOpen(false);
  };

  return <UpdateModal isOpen={isModalOpen} onClose={handleClose} version={appVersion} />;
}