
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ProfileCheckHandlerProps {
  studentNumber: string;
}

export function ProfileCheckHandler({ studentNumber }: ProfileCheckHandlerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hasChecked = sessionStorage.getItem('profileCheckComplete');
    if (hasChecked || !studentNumber) {
        setIsLoading(false);
        return;
    }

    async function checkProfile() {
      try {
        // We expect this call to either succeed or fail with a specific "User not found" message.
        await api.get(`/user-full-details/get/student/?student_number=${studentNumber}`);
        // If it succeeds, the user has details, so we do nothing.
      } catch (error: any) {
        // Check if the error response from the API indicates the user was not found.
        if (error.response && error.response.data && error.response.data.message === "User not found.") {
          router.push('/complete-profile');
        } else {
            // For any other unexpected errors, we log it but don't redirect.
            console.error('Failed to check user details:', error);
        }
      } finally {
        setIsLoading(false);
        sessionStorage.setItem('profileCheckComplete', 'true');
      }
    }

    checkProfile();
  }, [studentNumber, router]);

  return null;
}
