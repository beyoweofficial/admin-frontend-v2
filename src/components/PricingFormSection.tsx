import React from "react";
import { Calculator, DollarSign, Percent, TrendingUp } from "lucide-react";
import { colors } from "../theme/colors";

interface PricingFormSectionProps {
  basePrice: string;
  profitMarginPercentage: string;
  discountPercentage: string;
  profitMarginPrice: number;
  calculatedOriginalPrice: number;
  onBasepriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProfitMarginChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDiscountPercentageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PricingFormSection: React.FC<PricingFormSectionProps> = ({
  basePrice,
  profitMarginPercentage,
  discountPercentage,
  profitMarginPrice,
  calculatedOriginalPrice,
  onBasepriceChange,
  onProfitMarginChange,
  onDiscountPercentageChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Pricing Configuration
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Base Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Base Price *
          </label>
          <input
            type="number"
            name="basePrice"
            value={basePrice}
            onChange={onBasepriceChange}
            placeholder="Enter base price"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            min="0"
            step="0.01"
          />
          <p className="text-xs text-gray-500 mt-1">
            The actual cost price of the product
          </p>
        </div>

        {/* Profit Margin Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Percent className="w-4 h-4 inline mr-1" />
            Profit Margin %
          </label>
          <input
            type="number"
            name="profitMarginPercentage"
            value={profitMarginPercentage}
            onChange={onProfitMarginChange}
            placeholder="65"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            max="1000"
            step="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: 65% (recommended for good margins)
          </p>
        </div>

        {/* Discount Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Discount % for Display
          </label>
          <input
            type="number"
            name="discountPercentage"
            value={discountPercentage}
            onChange={onDiscountPercentageChange}
            placeholder="81"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
            max="99.99"
            step="0.01"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: 81% (creates attractive pricing display)
          </p>
        </div>
      </div>

      {/* Calculated Prices Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Calculated Prices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3 border">
            <div className="text-sm text-gray-600 mb-1">
              Profit Margin Price
            </div>
            <div className="text-lg font-semibold text-green-600">
              ₹{profitMarginPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              What customer actually pays
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border">
            <div className="text-sm text-gray-600 mb-1">
              Display Original Price
            </div>
            <div className="text-lg font-semibold text-gray-500 line-through">
              ₹{calculatedOriginalPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Crossed-out price shown to customer
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-900 mb-2">
            Customer will see:
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg text-gray-500 line-through">
              ₹{calculatedOriginalPrice.toFixed(2)}
            </span>
            <span className="text-xl font-bold text-green-600">
              ₹{profitMarginPrice.toFixed(2)}
            </span>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
              {discountPercentage}% OFF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingFormSection;
