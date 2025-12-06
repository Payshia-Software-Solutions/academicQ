
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
    // Only run this check once per session to avoid infinite loops.
    const hasChecked = sessionStorage.getItem('profileCheckComplete');
    if (hasChecked || !studentNumber) {
        setIsLoading(false);
        return;
    }

    async function checkProfile() {
      try {
        const response = await api.get(`/user-full-details/get/student/?student_number=${studentNumber}`);
        if (!response.data.found) {
          // Redirect to the complete profile page
          router.push('/complete-profile');
        }
      } catch (error) {
        // If the endpoint fails, we won't redirect.
        console.error('Failed to check user details:', error);
      } finally {
        setIsLoading(false);
        sessionStorage.setItem('profileCheckComplete', 'true');
      }
    }

    checkProfile();
  }, [studentNumber, router]);

  // This component doesn't render anything visible
  return null;
}
