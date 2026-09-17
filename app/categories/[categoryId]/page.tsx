import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { CategoryExplorer } from "@/components/categories/CategoryExplorer";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/LoadingState";

export default async function CategoryPage({ params }: PageProps<"/categories/[categoryId]">) {
  const { categoryId } = await params;
  const isValid = CATEGORIES.some((c) => c.id === categoryId);
  if (!isValid) notFound();
  return <Suspense fallback={<LoadingState />}><CategoryExplorer initialCategoryIds={[categoryId as CategoryId]} /></Suspense>;
}
