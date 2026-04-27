import { redirect } from "next/navigation";

/** Legacy URL: signup approvals live under User Management with a queue filter. */
export default function FreelancerApprovalsRedirectPage() {
  redirect("/dashboard/users?signup=1");
}
