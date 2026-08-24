import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { CategoryExplorer } from "@/components/categories/CategoryExplorer";

export default async function CategoryPage({ params }: PageProps<"/categories/[categoryId]">) {
  const { categoryId } = await params;
  const isValid = CATEGORIES.some((c) => c.id === categoryId);
  if (!isValid) notFound();
  return <CategoryExplorer initialCategoryIds={[categoryId as CategoryId]} />;
}
