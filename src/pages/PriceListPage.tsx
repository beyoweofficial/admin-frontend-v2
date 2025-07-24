import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Plus,
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  Calendar,
  User,
  HardDrive,
  AlertCircle,
} from "lucide-react";
import { PriceList, PriceListFormData } from "../types";
import { api } from "../utils/api";
import { colors } from "../theme/colors";

// API functions
const fetchPriceList = async () => {
  const response = await api.get("/price-lists");
  return response.data;
};

const uploadPriceList = async (formData: FormData) => {
  const response = await api.post("/price-lists/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

const updatePriceList = async ({
  id,
  formData,
}: {
  id: string;
  formData: FormData;
}) => {
  const response = await api.put(`/price-lists/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

const deletePriceList = async (id: string) => {
  const response = await api.delete(`/price-lists/${id}`);
  return response.data;
};

const togglePriceListStatus = async (id: string) => {
  const response = await api.patch(`/price-lists/${id}/toggle-status`);
  return response.data;
};

// Upload Modal Component
const UploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PriceListFormData) => void;
  isLoading: boolean;
  editData?: PriceList | null;
}> = ({ isOpen, onClose, onSubmit, isLoading, editData }) => {
  const [formData, setFormData] = useState<PriceListFormData>({
    documentName: editData?.documentName || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  React.useEffect(() => {
    if (editData) {
      setFormData({
        documentName: editData.documentName,
      });
    } else {
      setFormData({
        documentName: "",
      });
    }
    setSelectedFile(null);
  }, [editData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editData && !selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    onSubmit({
      ...formData,
      pdf: selectedFile || undefined,
    });
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (file.size > 1024 * 1024 * 1024) {
      // 1GB
      toast.error("File size cannot exceed 1GB");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editData ? "Edit Price List" : "Upload Price List"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Name *
            </label>
            <input
              type="text"
              value={formData.documentName}
              onChange={(e) =>
                setFormData({ ...formData, documentName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white"
              style={
                {
                  "--tw-ring-color": colors.primary.medium + "80",
                } as React.CSSProperties
              }
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary.medium;
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary.medium}40`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "";
                e.target.style.boxShadow = "";
              }}
              placeholder="Enter document name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PDF File {!editData && "*"}
            </label>

            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                dragActive
                  ? "border-gray-300 dark:border-gray-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              style={{
                borderColor: dragActive ? colors.primary.medium : undefined,
                backgroundColor: dragActive
                  ? colors.primary.light + "20"
                  : undefined,
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("pdf-file-input")?.click()}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-green-500" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-sm hover:opacity-80"
                    style={{ color: colors.status.error }}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drop your PDF file here, or{" "}
                      <label
                        htmlFor="pdf-file-input"
                        className="cursor-pointer hover:opacity-80 underline"
                        style={{ color: colors.primary.medium }}
                      >
                        browse
                      </label>
                    </p>
                    <input
                      id="pdf-file-input"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        console.log("File input changed:", e.target.files);
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PDF files only, up to 1GB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: colors.primary.medium }}
            >
              {isLoading ? "Uploading..." : editData ? "Update" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
export const PriceListPage: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(
    null
  );

  const queryClient = useQueryClient();

  // Fetch price list (only one allowed)
  const { data, isLoading, error } = useQuery({
    queryKey: ["priceList"],
    queryFn: fetchPriceList,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadPriceList,
    onSuccess: () => {
      toast.success("Price list uploaded successfully!");
      setIsUploadModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to upload price list"
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updatePriceList,
    onSuccess: () => {
      toast.success("Price list updated successfully!");
      setEditingPriceList(null);
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update price list"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePriceList,
    onSuccess: () => {
      toast.success("Price list deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete price list"
      );
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: togglePriceListStatus,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["priceList"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle status");
    },
  });

  const handleUpload = (formData: PriceListFormData) => {
    const data = new FormData();
    data.append("documentName", formData.documentName);
    if (formData.pdf) {
      data.append("pdf", formData.pdf);
    }

    if (editingPriceList) {
      updateMutation.mutate({ id: editingPriceList._id, formData: data });
    } else {
      uploadMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this price list? This action cannot be undone."
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (priceList: PriceList) => {
    setEditingPriceList(priceList);
    setIsUploadModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setEditingPriceList(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
          Error Loading Price List
        </h2>
        <p className="text-red-600 dark:text-red-300">
          Failed to load price list. Please try again later.
        </p>
      </div>
    );
  }

  const priceList = data?.data?.[0]; // Get the first (and only) price list

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Price List
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your PDF price list document
          </p>
        </div>
        {!priceList && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.primary.medium }}
          >
            <Plus size={20} className="mr-2" />
            Upload Price List
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderBottomColor: colors.primary.medium }}
          ></div>
        </div>
      ) : !priceList ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Price List Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload your first price list document to get started.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.primary.medium }}
          >
            <Plus size={20} className="mr-2" />
            Upload Price List
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText
                    className="h-8 w-8"
                    style={{ color: colors.primary.medium }}
                  />
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {priceList.documentName}
                  </h2>
                </div>
              </div>
              <span
                className="px-3 py-1 text-sm font-medium rounded-full"
                style={{
                  backgroundColor: priceList.isActive
                    ? colors.status.success + "20"
                    : colors.status.error + "20",
                  color: priceList.isActive
                    ? colors.status.success
                    : colors.status.error,
                }}
              >
                {priceList.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <HardDrive size={20} className="mr-3" />
                <div>
                  <p className="text-sm">File Size</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatFileSize(priceList.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <User size={20} className="mr-3" />
                <div>
                  <p className="text-sm">Uploaded By</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {priceList.uploadedBy.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar size={20} className="mr-3" />
                <div>
                  <p className="text-sm">Upload Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(priceList.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {/* <a
                href={priceList.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary.medium }}
              >
                <Download size={18} className="mr-2" />
                Download PDF
              </a> */}

              <button
                onClick={() => handleEdit(priceList)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit size={18} className="mr-2" />
                Edit
              </button>

              <button
                onClick={() => toggleStatusMutation.mutate(priceList._id)}
                className="inline-flex items-center px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: priceList.isActive
                    ? colors.status.warning + "20"
                    : colors.status.success + "20",
                  color: priceList.isActive
                    ? colors.status.warning
                    : colors.status.success,
                }}
              >
                {priceList.isActive ? (
                  <>
                    <EyeOff size={18} className="mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye size={18} className="mr-2" />
                    Activate
                  </>
                )}
              </button>

              <button
                onClick={() => handleDelete(priceList._id)}
                className="inline-flex items-center px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: colors.status.error + "20",
                  color: colors.status.error,
                }}
              >
                <Trash2 size={18} className="mr-2" />
                Delete
              </button>
            </div>

            {/* Warning Message */}
            <div
              className="mt-6 p-4 border rounded-lg"
              style={{
                backgroundColor: colors.status.warning + "15",
                borderColor: colors.status.warning + "40",
              }}
            >
              <div className="flex items-start">
                <AlertCircle
                  className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0"
                  style={{ color: colors.status.warning }}
                />
                <div>
                  <h4
                    className="text-sm font-medium"
                    style={{ color: colors.status.warning }}
                  >
                    Single Document Policy
                  </h4>
                  <p
                    className="text-sm mt-1"
                    style={{ color: colors.status.warning }}
                  >
                    Only one price list document is allowed at a time. To upload
                    a new document, you must first delete the existing one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleUpload}
        isLoading={uploadMutation.isPending || updateMutation.isPending}
        editData={editingPriceList}
      />
    </div>
  );
};
