import { ListsSection } from "@/components/ListsSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your lists — ITA",
  description: "Create, share and manage your to-do lists",
};

export default function ListsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <ListsSection />
    </main>
  );
}
