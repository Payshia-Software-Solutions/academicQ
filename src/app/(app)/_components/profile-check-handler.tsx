
'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface ProfileCheckHandlerProps {
  studentNumber: string;
}

export function ProfileCheckHandler({ studentNumber }: ProfileCheckHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't run the check if we are already on the page to complete the profile
    // or on auth pages, to prevent a redirect loop.
    if (pathname === '/complete-profile' || pathname.startsWith('/login') || pathname.startsWith('/register')) {
      return;
    }

    async function checkProfile() {
      if (!studentNumber) {
        return;
      }
      
      try {
        const response = await api.get(`/user-full-details/get/student/?student_number=${studentNumber}`);
        
        // The API returns a 200 OK status even for "User not found", so we check the response body.
        if (response.data && response.data.message === "User not found.") {
          router.push('/complete-profile');
        }
        // If the user is found (no "User not found." message), we do nothing.
        
      } catch (error: any) {
        // This will catch network errors or non-200 responses.
        // We log it but don't redirect, to avoid locking out the user due to a server error.
        console.error('Failed to check user details:', error);
      }
    }

    checkProfile();
  }, [studentNumber, router, pathname]);

  // This component does not render anything to the UI
  return null;
}

    