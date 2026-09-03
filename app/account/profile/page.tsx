import { PageHeading } from "@/components/account/AccountShell";
import ProfileForm from "./ProfileForm";

export default function ProfilePage() {
  return <><PageHeading eyebrow="Personal details" title="Your profile" copy="Keep your contact and delivery information up to date."/><ProfileForm /></>;
}
