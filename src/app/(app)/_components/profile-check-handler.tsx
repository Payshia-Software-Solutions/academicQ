
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CompleteProfileDialog } from './complete-profile-dialog';

interface ProfileCheckHandlerProps {
  studentNumber: string;
}

export function ProfileCheckHandler({ studentNumber }: ProfileCheckHandlerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run this check once per session to avoid annoying the user.
    const hasChecked = sessionStorage.getItem('profileCheckComplete');
    if (hasChecked || !studentNumber) {
        setIsLoading(false);
        return;
    }

    async function checkProfile() {
      try {
        const response = await api.get(`/user-full-details/get/student/?student_number=${studentNumber}`);
        if (!response.data.found) {
          setShowDialog(true);
        }
      } catch (error) {
        // If the endpoint fails, we won't show the dialog.
        console.error('Failed to check user details:', error);
      } finally {
        setIsLoading(false);
        sessionStorage.setItem('profileCheckComplete', 'true');
      }
    }

    checkProfile();
  }, [studentNumber]);

  if (isLoading) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <CompleteProfileDialog
      isOpen={showDialog}
      onOpenChange={setShowDialog}
      studentNumber={studentNumber}
    />
  );
}
