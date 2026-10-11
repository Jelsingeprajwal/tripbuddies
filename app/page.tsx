import { Button } from "@/components/ui/button";
import SignOutButton from "@/components/auth/sign-out-button";
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center ">
      <div className="font-inter ">
        Tripbuddies is a social media platform for travelers to connect and
        share their experiences. It allows users to create profiles, post photos
        and videos, and interact with other travelers through comments and
        likes. The platform also features a map view where users can discover
        new destinations and plan their trips with the help of the community.
        <br />
      </div>

      <SignOutButton />
    </div>
  );
}
