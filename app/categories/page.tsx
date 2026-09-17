import { CategoryExplorer } from "@/components/categories/CategoryExplorer";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/LoadingState";

export default function CategoriesPage() {
  return <Suspense fallback={<LoadingState />}><CategoryExplorer /></Suspense>;
}
