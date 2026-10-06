import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    token: string;
  };
}

export default async function CandidateInterviewSelectPage({ params }: PageProps) {
  const { token } = params;
  redirect(`/interview/confirm-slot/${token}`);
}
