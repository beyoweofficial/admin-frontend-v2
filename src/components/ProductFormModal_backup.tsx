import { useState, useRef, useEffect } from "react";
import {
  X,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Shield,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { Category, Subcategory } from "../types";
import { colors, themeConfig } from "../theme/colors";
import { useProductCodeValidation } from "../hooks/useProductCodeValidation";
import PricingFormSection from "./PricingFormSection";

interface ProductImage {
  file?: File;
  preview: string;
  name: string;
  size: number;
  isValid: boolean;
  errorMessage?: string;
}

interface ProductFormData {
  productCode: string;
  name: string;
  description: string;
  // Legacy price fields
  price: string;
  offerPrice: string;
  // New pricing fields
  basePrice: string;
  profitMarginPercentage: string;
  profitMarginPrice: number;
  discountPercentage: string;
  calculatedOriginalPrice: number;
  categoryId: string;
  subcategoryId: string;
  inStock: boolean;
  bestSeller: boolean;
  featured: boolean;
  tags: string;
  images: ProductImage[];
  // New fields
  isActive: boolean;
  youtubeLink: string;
  stockQuantity: string;
  // New inventory fields
  receivedDate: string;
  caseQuantity: string;
  receivedCase: string;
  brandName: string;
  totalAvailableQuantity: number;
  // Supplier fields
  supplierName: string;
  supplierPhone: string;
  // Customer quantity limit
  maxQuantityPerCustomer: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  initialData?: ProductFormData;
  categories?: Category[];
  subcategories?: Subcategory[];
  isSubmitting: boolean;
  isEditing: boolean;
  categoriesLoading?: boolean;
  subcategoriesLoading?: boolean;
  onRetryCategories?: () => void;
  onRetrySubcategories?: () => void;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  subcategories = [],
  isSubmitting,
  isEditing,
  categoriesLoading = false,
  subcategoriesLoading = false,
  onRetryCategories,
  onRetrySubcategories,
}: ProductFormModalProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    productCode: "",
    name: "",
    description: "",
    // Legacy price fields
    price: "",
    offerPrice: "",
    // New pricing fields
    basePrice: "",
    profitMarginPercentage: "65",
    profitMarginPrice: 0,
    discountPercentage: "81",
    calculatedOriginalPrice: 0,
    categoryId: "",
    subcategoryId: "",
    inStock: true,
    bestSeller: false,
    featured: false,
    tags: "",
    images: [],
    // Initialize new fields
    isActive: true,
    youtubeLink: "",
    stockQuantity: "300", // Default stock quantity
    // Initialize new inventory fields with defaults
    receivedDate: new Date().toISOString().split("T")[0], // Auto-fill today's date
    caseQuantity: "100", // Default case quantity
    receivedCase: "3", // Default received cases
    brandName: "Ajantha fireworks", // Default brand name
    totalAvailableQuantity: 300, // Will be auto-synced with stockQuantity
    // Supplier fields
    supplierName: "",
    supplierPhone: "",
    // Customer quantity limit
    maxQuantityPerCustomer: "",
  });

  // State to track if default image should be used
  const [useDefaultImage, setUseDefaultImage] = useState(true);
  // State to track if we're loading the default image
  const [isLoadingDefaultImage, setIsLoadingDefaultImage] = useState(false);

  // Remove pricing mode - keep it simple

  // Track if totalAvailableQuantity is manually set
  const [isQuantityManuallySet, setIsQuantityManuallySet] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Product code validation
  const productCodeValidation = useProductCodeValidation(
    formData.productCode,
    isEditing
  );

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      // Merge initialData with default values to ensure all fields are populated
      const formDataWithDefaults: ProductFormData = {
        productCode: initialData.productCode || "",
        name: initialData.name || "",
        description: initialData.description || "",
        // Legacy price fields
        price: initialData.price || "",
        offerPrice: initialData.offerPrice || "",
        // New pricing fields
        basePrice: initialData.basePrice || "",
        profitMarginPercentage: initialData.profitMarginPercentage || "65",
        profitMarginPrice: initialData.profitMarginPrice || 0,
        discountPercentage: initialData.discountPercentage || "81",
        calculatedOriginalPrice: initialData.calculatedOriginalPrice || 0,
        categoryId: initialData.categoryId || "",
        subcategoryId: initialData.subcategoryId || "",
        inStock: initialData.inStock !== undefined ? initialData.inStock : true,
        bestSeller:
          initialData.bestSeller !== undefined ? initialData.bestSeller : false,
        featured:
          initialData.featured !== undefined ? initialData.featured : false,
        tags: initialData.tags || "",
        images: initialData.images || [],
        isActive:
          initialData.isActive !== undefined ? initialData.isActive : true,
        youtubeLink: initialData.youtubeLink || "",
        stockQuantity:
          initialData.stockQuantity ||
          initialData.totalAvailableQuantity?.toString() ||
          "300",
        // New inventory fields
        receivedDate: (() => {
          if (initialData.receivedDate) {
            // Convert DD-MM-YYYY to YYYY-MM-DD for date input
            const [day, month, year] = initialData.receivedDate.split("-");
            return `${year}-${month}-${day}`;
          }
          return new Date().toISOString().split("T")[0]; // Auto-fill today's date if empty
        })(),
        caseQuantity: initialData.caseQuantity || "",
        receivedCase: initialData.receivedCase || "",
        brandName: initialData.brandName || "",
        totalAvailableQuantity: initialData.totalAvailableQuantity || 0,
        // Supplier fields
        supplierName: initialData.supplierName || "",
        supplierPhone: initialData.supplierPhone || "",
        // Customer quantity limit
        maxQuantityPerCustomer:
          initialData.maxQuantityPerCustomer?.toString() || "",
      };

      setFormData(formDataWithDefaults);
      // If editing and has images, don't use default image
      setUseDefaultImage(
        !initialData.images || initialData.images.length === 0
      );
    } else {
      // For new products, start with default image enabled
      setUseDefaultImage(true);
    }
  }, [initialData, isOpen]);

  // Silent data fetch only if absolutely necessary
  useEffect(() => {
    if (isOpen) {
      // Only refresh silently if no data is available at all
      if ((!categories || categories.length === 0) && onRetryCategories) {
        onRetryCategories();
      }
      if (
        (!subcategories || subcategories.length === 0) &&
        onRetrySubcategories
      ) {
        onRetrySubcategories();
      }
    }
  }, [isOpen]); // Remove dependencies to prevent constant refreshing

  // Auto-sync Total Available Quantity with Stock Quantity
  useEffect(() => {
    if (formData.stockQuantity) {
      const stockQty = parseInt(formData.stockQuantity);
      if (!isNaN(stockQty) && stockQty >= 0) {
        setFormData((prev) => ({
          ...prev,
          totalAvailableQuantity: stockQty,
        }));
      }
    }
  }, [formData.stockQuantity]);

  // Remove excessive logging

  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter((sub) => {
    // If no category is selected, don't filter subcategories
    if (!formData.categoryId) return true;

    try {
      // Handle both string and object categoryId
      if (typeof sub.categoryId === "string") {
        return sub.categoryId === formData.categoryId;
      } else if (sub.categoryId && typeof sub.categoryId === "object") {
        // Make sure the object has an _id property
        if ("_id" in sub.categoryId) {
          return sub.categoryId._id === formData.categoryId;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  });

  // Function to calculate total available quantity
  const calculateTotalQuantity = (
    caseQuantity: string,
    receivedCase: string
  ): number => {
    if (!caseQuantity || !receivedCase) return 0;

    // Extract numeric value from caseQuantity (e.g., "qty:100 box" -> 100)
    const qtyMatch = caseQuantity.match(/(\d+)/);
    if (qtyMatch) {
      const qty = parseInt(qtyMatch[1]);
      const cases = parseInt(receivedCase) || 0;
      return cases * qty;
    }
    return 0;
  };

  // Function to calculate pricing
  const calculatePricing = (
    basePrice: string,
    profitMarginPercentage: string,
    discountPercentage: string
  ) => {
    const base = parseFloat(basePrice) || 0;
    const profitMargin = parseFloat(profitMarginPercentage) || 65;
    const discount = parseFloat(discountPercentage) || 81;

    if (base <= 0) return { profitMarginPrice: 0, calculatedOriginalPrice: 0 };

    const profitMarginPrice = base + base * (profitMargin / 100);
    const calculatedOriginalPrice = profitMarginPrice / (1 - discount / 100);

    return { profitMarginPrice, calculatedOriginalPrice };
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle manual totalAvailableQuantity change (but it will be overridden by stockQuantity sync)
    if (name === "totalAvailableQuantity") {
      setIsQuantityManuallySet(true);
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    }
    // Handle pricing fields with automatic calculation
    else if (
      name === "basePrice" ||
      name === "profitMarginPercentage" ||
      name === "discountPercentage"
    ) {
      const newFormData = { ...formData, [name]: value };
      const { profitMarginPrice, calculatedOriginalPrice } = calculatePricing(
        name === "basePrice" ? value : formData.basePrice,
        name === "profitMarginPercentage"
          ? value
          : formData.profitMarginPercentage,
        name === "discountPercentage" ? value : formData.discountPercentage
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        profitMarginPrice,
        calculatedOriginalPrice,
        price: calculatedOriginalPrice.toString(),
        offerPrice: profitMarginPrice.toString(),
      }));
    }
    // Handle inventory fields with auto-calculation (only if not manually set)
    else if (
      (name === "caseQuantity" || name === "receivedCase") &&
      !isQuantityManuallySet
    ) {
      const newFormData = { ...formData, [name]: value };
      const totalQuantity = calculateTotalQuantity(
        name === "caseQuantity" ? value : formData.caseQuantity,
        name === "receivedCase" ? value : formData.receivedCase
      );
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        totalAvailableQuantity: totalQuantity,
        stockQuantity: totalQuantity.toString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    // Handle mutual exclusivity between bestSeller and featured
    if (name === "bestSeller") {
      if (checked) {
        // If checking bestSeller, uncheck featured
        setFormData((prev) => ({ ...prev, bestSeller: true, featured: false }));
      } else {
        // If unchecking bestSeller, just uncheck it (no featured change)
        setFormData((prev) => ({ ...prev, bestSeller: false }));
      }
    } else if (name === "featured") {
      if (checked) {
        // If checking featured, uncheck bestSeller
        setFormData((prev) => ({ ...prev, featured: true, bestSeller: false }));
      } else {
        // If unchecking featured, just uncheck it (no bestSeller change)
        setFormData((prev) => ({ ...prev, featured: false }));
      }
    } else {
      // Handle other checkboxes normally
      setFormData((prev) => ({ ...prev, [name]: checked }));
    }
  };

  const validateFile = (
    file: File
  ): { isValid: boolean; errorMessage?: string } => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        errorMessage: "Invalid file type. Only JPG, JPEG, and PNG are allowed.",
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        isValid: false,
        errorMessage: `File too large (${sizeMB}MB). Maximum size is 1MB.`,
      };
    }

    return { isValid: true };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the 3 image limit
    const remainingSlots = 3 - formData.images.length;
    if (files.length > remainingSlots) {
      alert(
        `You can only add ${remainingSlots} more image${
          remainingSlots !== 1 ? "s" : ""
        }. Please select fewer files.`
      );
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const newImages: ProductImage[] = [];
    let hasInvalidFiles = false;

    Array.from(files).forEach((file) => {
      const validation = validateFile(file);

      if (!validation.isValid) {
        hasInvalidFiles = true;
      }

      // Create a preview URL for the image
      const preview = URL.createObjectURL(file);

      newImages.push({
        file,
        preview,
        name: file.name,
        size: file.size,
        isValid: validation.isValid,
        errorMessage: validation.errorMessage,
      });
    });

    if (hasInvalidFiles) {
      // Show a warning but still add the images to the form so user can see the errors
      toast.warning(
        "Some files have validation errors. Please check and remove them before submitting."
      );
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 3), // Limit to 3 images
    }));

    // Disable default image when user adds their own images
    if (newImages.length > 0) {
      setUseDefaultImage(false);
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = formData.images[index];

    // If it's an invalid image, remove without confirmation
    if (!imageToRemove.isValid) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));
      // Re-enable default image if no images left and not editing
      if (newImages.length === 0 && !isEditing) {
        setUseDefaultImage(true);
      }
      return;
    }

    // For valid images, ask for confirmation
    if (window.confirm(`Are you sure you want to remove this image?`)) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));
      // Re-enable default image if no images left and not editing
      if (newImages.length === 0 && !isEditing) {
        setUseDefaultImage(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check product code validation for new products
    if (!isEditing) {
      if (!formData.productCode) {
        toast.error("Please enter a product code.");
        return;
      }

      // Auto-verify the product code if it hasn't been checked yet
      if (
        !productCodeValidation.hasChecked &&
        formData.productCode.length >= 3
      ) {
        productCodeValidation.verifyProductCode();
        toast.info("Verifying product code...");
        return;
      }

      if (
        productCodeValidation.hasChecked &&
        !productCodeValidation.isAvailable
      ) {
        toast.error(
          "Product code is not available. Please choose a different code."
        );
        return;
      }
    }

    // Check if there are any invalid images
    const hasInvalidImages = formData.images.some((img) => !img.isValid);
    if (hasInvalidImages) {
      toast.error("Please remove invalid images before submitting.");
      return;
    }

    // For new products, we always have an image (either user uploaded or default)
    // For editing, check if at least one image is provided
    if (isEditing && formData.images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    // Check if base price is provided
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error("Please enter a valid base price.");
      return;
    }

    // Validate supplier phone format only if provided
    if (formData.supplierPhone && formData.supplierPhone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.supplierPhone)) {
        toast.error("Please enter a valid 10-digit phone number.");
        return;
      }
    }

    // Check if categories are available
    if (categories.length === 0) {
      toast.error(
        "Categories are not available. Please refresh and try again."
      );
      return;
    }

    // Check if a category is selected
    if (!formData.categoryId) {
      toast.error("Please select a category.");
      return;
    }

    // Check if subcategories are available for the selected category
    if (filteredSubcategories.length === 0) {
      toast.error(
        "No subcategories available for the selected category. Please select a different category or refresh subcategories."
      );
      return;
    }

    // Check if a subcategory is selected
    if (!formData.subcategoryId) {
      toast.error("Please select a subcategory.");
      return;
    }

    // Check if base price is provided and valid
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error("Please enter a valid base price greater than 0.");
      return;
    }

    // Create FormData object for multipart/form-data submission
    const submitData = new FormData();
    if (!isEditing) {
      submitData.append("productCode", formData.productCode);
    }
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);

    // New pricing fields
    submitData.append("basePrice", formData.basePrice);
    submitData.append(
      "profitMarginPercentage",
      formData.profitMarginPercentage
    );
    submitData.append("discountPercentage", formData.discountPercentage);

    // Legacy price fields (will be calculated on backend)
    submitData.append("price", formData.price);
    if (formData.offerPrice) {
      submitData.append("offerPrice", formData.offerPrice);
    }

    submitData.append("categoryId", formData.categoryId);
    submitData.append("subcategoryId", formData.subcategoryId);
    submitData.append("inStock", String(formData.inStock));
    submitData.append("bestSeller", String(formData.bestSeller));
    submitData.append("featured", String(formData.featured));

    // Add new fields
    submitData.append("isActive", String(formData.isActive));

    if (formData.youtubeLink) {
      submitData.append("youtubeLink", formData.youtubeLink);
    }

    // Stock quantity should match total available quantity
    const finalStockQuantity = formData.totalAvailableQuantity || 300;
    submitData.append("stockQuantity", finalStockQuantity.toString());

    if (formData.tags) {
      submitData.append("tags", formData.tags);
    }

    // New inventory fields - always send these fields
    // Convert date from YYYY-MM-DD to DD-MM-YYYY format for backend
    const convertDateFormat = (dateStr: string) => {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      return `${day}-${month}-${year}`;
    };
    submitData.append(
      "receivedDate",
      convertDateFormat(formData.receivedDate) || ""
    );
    submitData.append("caseQuantity", formData.caseQuantity || "100");
    submitData.append("receivedCase", formData.receivedCase || "3");
    submitData.append("brandName", formData.brandName || "Ajantha fireworks");
    submitData.append(
      "totalAvailableQuantity",
      formData.totalAvailableQuantity
        ? formData.totalAvailableQuantity.toString()
        : "300"
    );

    // Supplier fields - always send these fields
    submitData.append("supplierName", formData.supplierName || "");
    submitData.append("supplierPhone", formData.supplierPhone || "");

    // Customer quantity limit
    submitData.append(
      "maxQuantityPerCustomer",
      formData.maxQuantityPerCustomer || ""
    );

    // Append image files
    if (formData.images.length > 0) {
      // User has uploaded images, use them
      formData.images.forEach((img) => {
        if (img.file) {
          submitData.append("images", img.file);
        }
      });
    } else if (!isEditing && useDefaultImage) {
      // No user images and creating new product, fetch and append default image
      setIsLoadingDefaultImage(true);
      try {
        const response = await fetch("/defaultimage.jpg");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const defaultImageFile = new File([blob], "defaultimage.jpg", {
          type: blob.type || "image/jpeg",
        });
        submitData.append("images", defaultImageFile);
      } catch (error) {
        console.error("Failed to load default image:", error);
        toast.error(
          "Failed to load default image. Please upload an image manually."
        );
        setIsLoadingDefaultImage(false);
        return;
      } finally {
        setIsLoadingDefaultImage(false);
      }
    }

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 max-w-5xl w-full my-2 sm:my-4 max-h-[98vh] sm:max-h-[95vh] overflow-y-auto"
        style={{
          borderRadius: themeConfig.borderRadius,
        }}
      >
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-white dark:bg-gray-800 z-10 py-2">
          <div className="flex items-center min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {isEditing ? "Edit Product" : "Create Product"}
            </h3>
            {process.env.NODE_ENV === "development" && (
              <button
                type="button"
                onClick={() => {
                  // Debug info (development only)
                  console.log("Current form state:", formData);
                  console.log("Categories:", categories);
                  console.log("Subcategories:", subcategories);
                  console.log("Filtered subcategories:", filteredSubcategories);
                }}
                className="ml-2 sm:ml-3 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 px-1.5 sm:px-2 py-1 rounded hidden sm:block"
              >
                Debug
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Product Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Code*
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="productCode"
                  value={formData.productCode}
                  onChange={(e) => {
                    // Only allow alphanumeric characters and convert to uppercase
                    const value = e.target.value
                      .replace(/[^A-Za-z0-9]/g, "")
                      .toUpperCase();
                    setFormData((prev) => ({
                      ...prev,
                      productCode: value,
                    }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 transition-all ${
                    productCodeValidation.isChecking
                      ? "border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500"
                      : productCodeValidation.hasChecked
                      ? productCodeValidation.isAvailable
                        ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                        : "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  } ${isEditing ? "bg-gray-100 dark:bg-gray-600" : ""}`}
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="e.g., ABC123"
                  required
                  disabled={isEditing}
                  maxLength={20}
                />

                {/* Validation Icon */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {productCodeValidation.isChecking && (
                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                  )}
                  {productCodeValidation.hasChecked &&
                    !productCodeValidation.isChecking && (
                      <>
                        {productCodeValidation.isAvailable ? (
                          <ShieldCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <Shield className="w-4 h-4 text-red-500" />
                        )}
                      </>
                    )}
                  {!isEditing &&
                    formData.productCode.length >= 3 &&
                    !productCodeValidation.isChecking &&
                    !productCodeValidation.hasChecked && (
                      <button
                        type="button"
                        onClick={productCodeValidation.verifyProductCode}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                      >
                        Verify
                      </button>
                    )}
                  {!isEditing &&
                    formData.productCode.length > 0 &&
                    formData.productCode.length < 3 && (
                      <span className="text-xs text-gray-500">Min 3 chars</span>
                    )}
                </div>
              </div>

              {/* Validation Message */}
              {productCodeValidation.message && (
                <p
                  className={`text-xs mt-1 ${
                    productCodeValidation.isChecking
                      ? "text-yellow-600"
                      : productCodeValidation.isAvailable
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {productCodeValidation.message}
                </p>
              )}

              {!isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Alphanumeric characters only (A-Z, 0-9). Code will be
                  converted to uppercase.
                </p>
              )}
            </div>

            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name*
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="Enter product name"
                required
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              style={{ borderRadius: themeConfig.borderRadius }}
              placeholder="Enter product description"
            />
          </div>

          {/* Row 3: Pricing, Category, Subcategory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Pricing Section */}
            <div>
              <PricingFormSection
                basePrice={formData.basePrice}
                profitMarginPercentage={formData.profitMarginPercentage}
                discountPercentage={formData.discountPercentage}
                profitMarginPrice={formData.profitMarginPrice}
                calculatedOriginalPrice={formData.calculatedOriginalPrice}
                onBasepriceChange={handleInputChange}
                onProfitMarginChange={handleInputChange}
                onDiscountPercentageChange={handleInputChange}
              />
            </div>

            {/* Category */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category*
                </label>
                {onRetryCategories && (
                  <button
                    type="button"
                    onClick={onRetryCategories}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Refresh Categories
                  </button>
                )}
              </div>

              <div className="relative">
                {categoriesLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}

                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => {
                    handleInputChange(e);
                    setFormData((prev) => ({ ...prev, subcategoryId: "" }));
                  }}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    categoriesLoading ? "pr-10" : ""
                  }`}
                  style={{ borderRadius: themeConfig.borderRadius }}
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {categories.length === 0 && !categoriesLoading && (
                <p className="text-xs text-red-500 mt-1">
                  No categories available. Please refresh.
                </p>
              )}
            </div>

            {/* Subcategory */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subcategory*
                </label>
                {onRetrySubcategories && (
                  <button
                    type="button"
                    onClick={onRetrySubcategories}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Refresh Subcategories
                  </button>
                )}
              </div>

              <div className="relative">
                {subcategoriesLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}

                <select
                  name="subcategoryId"
                  value={formData.subcategoryId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    subcategoriesLoading ? "pr-10" : ""
                  }`}
                  style={{ borderRadius: themeConfig.borderRadius }}
                  disabled={!formData.categoryId || subcategoriesLoading}
                  required
                >
                  <option value="">Select Subcategory</option>
                  {filteredSubcategories.map((subcategory) => (
                    <option key={subcategory._id} value={subcategory._id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.categoryId &&
                filteredSubcategories.length === 0 &&
                !subcategoriesLoading && (
                  <p className="text-xs text-red-500 mt-1">
                    No subcategories available for this category. Please refresh
                    or select a different category.
                  </p>
                )}
            </div>
          </div>

          {/* Row 4: Stock & Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Qty
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="0"
                min="0"
              />
            </div>

            {/* In Stock Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                In Stock
              </label>
              <label className="flex items-center space-x-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Available
                </span>
              </label>
            </div>

            {/* Best Seller Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Best Seller
              </label>
              <label className="flex items-center space-x-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="bestSeller"
                  checked={formData.bestSeller}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Yes
                </span>
              </label>
            </div>

            {/* Featured Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Featured
              </label>
              <label className="flex items-center space-x-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Yes
                </span>
              </label>
            </div>
          </div>

          {/* Row 5: Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* YouTube Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                YouTube Link
              </label>
              <input
                type="url"
                name="youtubeLink"
                value={formData.youtubeLink}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="https://youtube.com/..."
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brand
              </label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="Brand name"
              />
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier
              </label>
              <input
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="Supplier name"
              />
            </div>
          </div>

          {/* Row 6: Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Received Cases */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Received Cases
              </label>
              <input
                type="number"
                name="receivedCase"
                value={formData.receivedCase}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Case Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Case Qty
              </label>
              <input
                type="text"
                name="caseQuantity"
                value={formData.caseQuantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="e.g., 100"
              />
            </div>

            {/* Total Available */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Available
              </label>
              <input
                type="number"
                name="totalAvailableQuantity"
                value={formData.totalAvailableQuantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Row 7: Limits & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Max Quantity Per Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Qty/Customer
              </label>
              <input
                type="number"
                name="maxQuantityPerCustomer"
                value={formData.maxQuantityPerCustomer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="No limit"
                min="1"
              />
            </div>

            {/* Supplier Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier Phone
              </label>
              <input
                type="tel"
                name="supplierPhone"
                value={formData.supplierPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="10-digit phone"
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ borderRadius: themeConfig.borderRadius }}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>



          {/* Row 8: Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Images {isEditing ? "*" : ""} (Max 3, 1MB each)
            </label>

            <div
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add("border-blue-500");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove("border-blue-500");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove("border-blue-500");

                if (formData.images.length >= 3) {
                  toast.warning("Maximum number of images (3) reached");
                  return;
                }

                const droppedFiles = Array.from(e.dataTransfer.files).filter(
                  (file) => file.type.startsWith("image/")
                );

                if (droppedFiles.length === 0) {
                  toast.error("Please drop image files only");
                  return;
                }

                // Create a synthetic event object to reuse our existing handler
                const syntheticEvent = {
                  target: {
                    files: droppedFiles,
                  },
                } as React.ChangeEvent<HTMLInputElement>;

                handleFileChange(syntheticEvent);
              }}
            >
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Upload images</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png"
                      multiple={formData.images.length < 3}
                      disabled={formData.images.length >= 3}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG up to 1MB
                </p>
                {formData.images.length >= 3 && (
                  <p className="text-xs text-yellow-500">
                    Maximum number of images (3) reached
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {3 - formData.images.length} of 3 image slots available
                </p>
              </div>
            </div>

            {/* Image Previews */}
            {(formData.images.length > 0 ||
              (!isEditing && useDefaultImage)) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Show default image if no user images and not editing */}
                {!isEditing &&
                  useDefaultImage &&
                  formData.images.length === 0 && (
                    <div className="relative border border-blue-300 rounded-lg overflow-hidden">
                      <img
                        src="/defaultimage.jpg"
                        alt="Default product image"
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2 bg-white dark:bg-gray-700 text-xs">
                        <div className="truncate text-blue-600 font-medium">
                          Default Image
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-blue-600">
                            Will be used automatically
                          </span>
                          <CheckCircle size={16} className="text-blue-500" />
                        </div>
                      </div>
                    </div>
                  )}

                {/* Show user uploaded images */}
                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative border rounded-lg overflow-hidden ${
                      image.isValid ? "border-green-300" : "border-red-300"
                    }`}
                  >
                    <img
                      src={image.preview}
                      alt={`Preview ${index}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-2 bg-white dark:bg-gray-700 text-xs">
                      <div className="truncate">{image.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span>{formatFileSize(image.size)}</span>
                        {image.isValid ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <div className="flex items-center text-red-500">
                            <AlertCircle size={16} className="mr-1" />
                            <span className="truncate">
                              {image.errorMessage}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 py-4 z-10">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Highlights
                </h4>
                <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                  <AlertCircle size={14} />
                  <span>Optional - Choose one or none</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.bestSeller
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-500"
                      : formData.featured
                      ? "border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 opacity-60 cursor-not-allowed"
                      : "border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 hover:border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="bestSeller"
                    checked={formData.bestSeller}
                    onChange={handleCheckboxChange}
                    disabled={formData.featured}
                    className="rounded text-yellow-600 focus:ring-yellow-500 disabled:opacity-50"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <svg
                        className="w-3 h-3 text-yellow-600 dark:text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Best Seller
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    formData.featured
                      ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500"
                      : formData.bestSeller
                      ? "border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 opacity-60 cursor-not-allowed"
                      : "border-gray-200 bg-white dark:bg-gray-700 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleCheckboxChange}
                    disabled={formData.bestSeller}
                    className="rounded text-purple-600 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <svg
                        className="w-3 h-3 text-purple-600 dark:text-purple-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Featured
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-start space-x-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  <p className="font-medium">
                    {formData.bestSeller
                      ? "Best Seller Selected"
                      : formData.featured
                      ? "Featured Product Selected"
                      : "Regular Product"}
                  </p>
                  <p className="mt-1">
                    {formData.bestSeller || formData.featured
                      ? `This product will be highlighted as ${
                          formData.bestSeller
                            ? "a best seller"
                            : "a featured item"
                        } in the store. You can uncheck to make it a regular product.`
                      : "This is a regular product with no special highlighting. You can optionally mark it as Featured or Best Seller."}
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </span>
            </label>
          </div>

          {/* Inventory Management Section */}
          <div className="sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Inventory Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="e.g., Nike, Adidas"
                />
              </div>

              {/* Received Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Received Date
                </label>
                <input
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: Today's date. Click to choose a different date.
                </p>
              </div>

              {/* Case Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Case Quantity
                </label>
                <input
                  type="text"
                  name="caseQuantity"
                  value={formData.caseQuantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="e.g., qty:100 box, qty:50 pack"
                />
              </div>

              {/* Received Cases */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Received Cases
                </label>
                <input
                  type="number"
                  name="receivedCase"
                  value={formData.receivedCase}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="Number of cases received"
                  min="0"
                />
              </div>

              {/* Stock Quantity (Main input field) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="Enter stock quantity"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the stock quantity - Total Available Quantity will
                  auto-sync
                </p>
              </div>

              {/* Total Available Quantity (Auto-synced with Stock Quantity) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Total Available Quantity (Display)
                </label>
                <input
                  type="number"
                  name="totalAvailableQuantity"
                  value={formData.totalAvailableQuantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  min="0"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-synced with Stock Quantity
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Information Section */}
          <div className="sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Supplier Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Supplier Name (Optional)
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="Supplier company name"
                />
              </div>

              {/* Supplier Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Supplier Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="supplierPhone"
                  value={formData.supplierPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="10-digit phone number"
                  pattern="[0-9]{10}"
                  maxLength="10"
                />
              </div>
            </div>
          </div>

          {/* Customer Quantity Limit Section */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 sm:p-6 rounded-lg border border-orange-200 dark:border-orange-800">
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Customer Purchase Limits
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Max Quantity Per Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Max Quantity Per Customer (Optional)
                </label>
                <input
                  type="number"
                  name="maxQuantityPerCustomer"
                  value={formData.maxQuantityPerCustomer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  style={{ borderRadius: themeConfig.borderRadius }}
                  placeholder="e.g., 10 (leave empty for no limit)"
                  min="1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Set maximum quantity each customer can add to cart. Leave
                  empty for no limit.
                </p>
              </div>
            </div>
          </div>

          {/* YouTube Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
              YouTube Link (Optional)
            </label>
            <input
              type="text"
              name="youtubeLink"
              value={formData.youtubeLink}
              onChange={handleInputChange}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              style={{ borderRadius: themeConfig.borderRadius }}
              placeholder="e.g., https://www.youtube.com/watch?v=example"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-6 sticky bottom-0 bg-white dark:bg-gray-800 py-4 z-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              style={{ borderRadius: themeConfig.borderRadius }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingDefaultImage ||
                formData.images.some((img) => !img.isValid) ||
                (!isEditing &&
                  (!productCodeValidation.isAvailable ||
                    !productCodeValidation.hasChecked)) ||
                productCodeValidation.isChecking
              }
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
              }}
            >
              {isSubmitting
                ? "Saving..."
                : isLoadingDefaultImage
                ? "Loading default image..."
                : isEditing
                ? "Update Product"
                : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
