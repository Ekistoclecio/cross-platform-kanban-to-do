import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function useUserAvatarTopBar() {
  const router = useRouter();

  async function logout() {
    await signOut({
      redirect: false,
    });

    router.replace("/");
  }

  return { logout };
}
