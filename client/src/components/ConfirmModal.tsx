interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    subtitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal = ({
    isOpen,
    title,
    subtitle,
    onConfirm,
    onCancel,
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.6)" }}
        >
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {title}
                </h2>
                <p className="text-gray-600 mb-6">{subtitle}</p>
                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                        onClick={onCancel}
                    >
                        Não
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
                        onClick={onConfirm}
                    >
                        Sim
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
