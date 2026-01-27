import { SWRConfiguration } from 'swr';

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  // Revalidate on focus (when user returns to tab) - reduced frequency
  revalidateOnFocus: false, // Disabled to reduce unnecessary requests
  
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  
  // Dedupe requests within 5 seconds (increased from 2s)
  dedupingInterval: 5000,
  
  // Keep data fresh for 10 minutes (increased from 5 minutes)
  focusThrottleInterval: 10 * 60 * 1000,
  
  // Revalidate if data is stale (older than 5 minutes)
  revalidateIfStale: true,
  
  // Keep previous data while revalidating
  keepPreviousData: true,
  
  // Retry on error
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Cache provider (optional, uses default Map)
  // provider: () => new Map(),
};

// Fetcher function for SWR
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};

// Fetcher with authentication token
export const fetcherWithAuth = async (url: string) => {
  const token = localStorage.getItem('authToken');
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};
