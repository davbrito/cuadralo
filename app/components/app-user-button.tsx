import { UserButton } from "@clerk/react-router";
import { useMediaQuery } from "usehooks-ts";

export function AppUserButton() {
  const isLG = useMediaQuery("(min-width: 64rem)");
  return (
    <div className="flex items-center gap-3">
      <UserButton showName={isLG} />
    </div>
  );
}
