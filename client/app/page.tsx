import { redirect } from 'next/navigation';

// DEV: bypass login — redirect straight to dashboard
export default async function Home() {
  redirect('/dashboard');
}
