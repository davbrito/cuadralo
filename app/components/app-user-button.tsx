import { UserButton } from "@clerk/react-router";

export function AppUserButton() {
  return (
    <div className="p-3 flex flex-col">
      <UserButton showName />
    </div>
  );
}
