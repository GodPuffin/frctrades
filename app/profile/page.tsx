import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import AccountForm from "@/components/Profile/AccountForm";

export default async function ProfilePage() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <>
      <AccountForm user={data.user} />
    </>
  );
}
