import { SignIn } from "@clerk/react-router";

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
