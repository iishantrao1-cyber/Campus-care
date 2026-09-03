import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";

export async function HeaderWrap() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  return (
    <SiteHeader
      user={user ? { name: user.name, role: user.role } : null}
    />
  );
}
