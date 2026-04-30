import { redirect } from 'next/navigation';

// Root redirects to main browse page
export default function RootPage() {
  redirect('/browse');
}
