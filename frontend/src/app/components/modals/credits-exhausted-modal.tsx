import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";

interface CreditsExhaustedModalProps {
    isOpen: boolean;
    onClose: () => void;
    resetDate: string;
}

export function CreditsExhaustedModal({
    isOpen,
    onClose,
    resetDate,
}: CreditsExhaustedModalProps) {
    const t = useTranslations("modals");
    const tCommon = useTranslations("common");
    if (!isOpen) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[200]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-md px-4">
                <div className="relative bg-white rounded-2xl shadow-2xl p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <h2 className="text-3xl font-light font-eb-garamond text-gray-900">
                            {t("creditsExhaustedTitle")}
                        </h2>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            {t("creditsExhaustedBody")}
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900 font-medium mb-1">
                                {t("creditsResetOn")}
                            </p>
                            <p className="text-lg font-semibold text-blue-700">
                                {formatDate(resetDate, { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                        </div>

                        <p className="text-sm text-gray-500">
                            {t("creditsResetHint")}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            {tCommon("close")}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body,
    );
}
