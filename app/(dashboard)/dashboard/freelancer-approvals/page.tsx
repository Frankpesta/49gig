import { redirect } from "next/navigation";

/** Legacy URL: signup approvals live under User Management (use “Awaiting signup approval” filter). */
export default function FreelancerApprovalsRedirectPage() {
  redirect("/dashboard/users");
}
