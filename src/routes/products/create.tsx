import { createFileRoute, Link } from "@tanstack/react-router";
import { FormProvider } from "react-hook-form";
import FormImage from "./-components/create/form-image";
import FormTags from "./-components/create/form-tags";
import FormInventory from "./-components/create/form-inventory";
import FormVariants from "./-components/create/form-variants";
import FormPrice from "./-components/create/form-price";
import FormInfo from "./-components/create/form-info";
import { useProductForm } from "../../hooks/useProductForm";

export const Route = createFileRoute("/products/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const { form, handleSubmit, handleImageSelect, removeImage, isUploading } =
    useProductForm();

  return (
    <FormProvider {...form}>
      <div className="min-h-screen">
        <div className="mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/products"
                className="border-accent inline-flex items-center rounded-lg border p-1"
              >
                <svg
                  className="mr-1 size-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div className="">
                返回商品列表
                <h1 className="text-3xl font-bold">新增商品</h1>
              </div>
            </div>
          </div>
          <hr className="text-accent my-10" />
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <FormImage
                    onImageUpload={handleImageSelect}
                    onImageRemove={removeImage}
                    isUploading={isUploading}
                  />
                  <FormInfo />
                  <FormVariants />
                  <FormInventory />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-1">
                <FormTags />
                <FormPrice />

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting || isUploading}
                  className="bg-accent text-accent-content mt-6 w-full rounded-lg px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {form.formState.isSubmitting ? "建立中..." : "建立商品"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}
