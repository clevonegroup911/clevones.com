import { permanentRedirect } from "next/navigation";

/** Legacy French home URL — canonical home is now `/`. */
export default function AccueilRedirect() {
  permanentRedirect("/");
}
