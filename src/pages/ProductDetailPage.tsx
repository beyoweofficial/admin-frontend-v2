import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Star,
  Tag,
  Package,
  Calendar,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import api from "../utils/api";
import { Product } from "../types";
import { colors, themeConfig } from "../theme/colors";
import { extractIdFromSlug } from "../utils/slugify";

const fetchProduct = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data.product || response.data;
};

export const ProductDetailPage = () => {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Extract the actual MongoDB ID from the slug
  const productId = slug ? extractIdFromSlug(slug) : null;

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId!),
    enabled: !!productId,
    onError: (error: any) => {
      toast.error("Failed to load product details");
      console.error("Error fetching product:", error);
    },
  });

  const handleImageNavigation = (direction: "prev" | "next") => {
    if (!product?.images.length) return;

    if (direction === "prev") {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    } else {
      setSelectedImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Package size={64} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Product Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Products</span>
        </button>
      </div>
    );
  }

  // Use new pricing system if available, fallback to legacy
  const discountPercentage = product.discountPercentage
    ? Math.round(product.discountPercentage)
    : product.savingsPercentage ||
      (product.offerPrice
        ? Math.round(
            ((product.price - product.offerPrice) / product.price) * 100
          )
        : 0);

  // Get the actual selling price (what customer pays)
  const sellingPrice =
    product.profitMarginPrice ||
    product.finalPrice ||
    product.offerPrice ||
    product.price;

  // Get the display original price (crossed out price)
  const originalPrice = product.calculatedOriginalPrice || product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate("/products")}
        className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Products</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[selectedImageIndex]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setIsImageModalOpen(true)}
                />

                {/* Image Navigation */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageNavigation("prev")}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => handleImageNavigation("next")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Zoom Icon */}
                <div className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={20} />
                </div>

                {/* Image Counter */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {product.images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package size={64} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>
            </div>

            {/* Badges */}
            <div className="flex items-center space-x-2 mb-4">
              {product.bestSeller && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-medium">
                  <Star size={14} fill="currentColor" />
                  <span>Best Seller</span>
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.inStock
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
              {discountPercentage > 0 && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm font-medium">
                  <Tag size={14} />
                  <span>{discountPercentage}% OFF</span>
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              {discountPercentage > 0 ? (
                <>
                  <span className="text-3xl font-bold text-green-600">
                    ₹{sellingPrice.toLocaleString()}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    ₹{originalPrice.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{sellingPrice.toLocaleString()}
                </span>
              )}
            </div>
            {discountPercentage > 0 && (
              <p className="text-green-600 font-medium">
                You save ₹{(originalPrice - sellingPrice).toLocaleString()}
                {discountPercentage > 0 && ` (${discountPercentage}% off)`}
              </p>
            )}

            {/* Pricing Breakdown (Admin View) */}
            {(product.basePrice || product.profitMarginPercentage) && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Pricing Breakdown
                </h4>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {product.basePrice && (
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>₹{product.basePrice.toLocaleString()}</span>
                    </div>
                  )}
                  {product.profitMarginPercentage && (
                    <div className="flex justify-between">
                      <span>Profit Margin:</span>
                      <span>{product.profitMarginPercentage}%</span>
                    </div>
                  )}
                  {product.profitMarginPrice && (
                    <div className="flex justify-between">
                      <span>Selling Price:</span>
                      <span>₹{product.profitMarginPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {product.discountPercentage && (
                    <div className="flex justify-between">
                      <span>Display Discount:</span>
                      <span>{product.discountPercentage}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category and Subcategory */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Category Information
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {typeof product.categoryId === "object" && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-sm font-medium">
                  Category: {product.categoryId.name}
                </span>
              )}
              {typeof product.subcategoryId === "object" && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-sm font-medium">
                  Subcategory: {product.subcategoryId.name}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inventory & Supplier Info */}
          {(product.brandName ||
            product.supplierName ||
            product.receivedDate ||
            product.totalAvailableQuantity) && (
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Inventory Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.brandName && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Package size={16} className="text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Brand:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.brandName}
                    </span>
                  </div>
                )}
                {product.supplierName && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Package size={16} className="text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Supplier:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.supplierName}
                    </span>
                  </div>
                )}
                {product.receivedDate && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar size={16} className="text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Received:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.receivedDate}
                    </span>
                  </div>
                )}
                {product.totalAvailableQuantity !== undefined && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Package size={16} className="text-orange-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Available:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.totalAvailableQuantity} units
                    </span>
                  </div>
                )}
                {product.caseQuantity && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Package size={16} className="text-indigo-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Case Info:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.caseQuantity}
                    </span>
                  </div>
                )}
                {product.receivedCase !== undefined && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Package size={16} className="text-teal-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Cases Received:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {product.receivedCase}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>
                Added on {new Date(product.createdAt).toLocaleDateString()}
              </span>
            </div>

            {product.imageCount && (
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <Star size={16} />
                <span>
                  {product.imageCount} image
                  {product.imageCount !== 1 ? "s" : ""} available
                </span>
              </div>
            )}
            {product.tagCount && (
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <Tag size={16} />
                <span>
                  {product.tagCount} tag{product.tagCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && product.images && product.images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>

            <img
              src={product.images[selectedImageIndex]?.url}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />

            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => handleImageNavigation("prev")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => handleImageNavigation("next")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
