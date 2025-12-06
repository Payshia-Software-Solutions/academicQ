
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
        const response = await api.get(`/user-full-details/get/student/?student_number=${studentNumber}`);
        
        // The API returns a 200 OK status even for "User not found", so we check the response body.
        if (response.data && response.data.message === "User not found.") {
          router.push('/complete-profile');
        }
        // If the user is found (no "User not found." message), we do nothing.
        
      } catch (error: any) {
        // This will now only catch network errors or non-200 responses.
        console.error('Failed to check user details:', error);
      } finally {
        setIsLoading(false);
        sessionStorage.setItem('profileCheckComplete', 'true');
      }
    }

    checkProfile();
  }, [studentNumber, router]);

  return null;
}
