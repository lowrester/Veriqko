import { FileIcon, Film } from 'lucide-react'

interface EvidenceItem {
    id: string
    evidence_type: 'photo' | 'video' | 'document'
    original_filename: string
    file_path: string // URL or path
    created_at: string
}

interface EvidenceGalleryProps {
    items: EvidenceItem[]
}

export function EvidenceGallery({ items }: EvidenceGalleryProps) {
    if (!items || items.length === 0) return null

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {items.map((item) => (
                <div key={item.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {item.evidence_type === 'photo' ? (
                        <img
                            src={item.file_path.startsWith('http') ? item.file_path : `/api/v1/evidence/${item.id}/file`}
                            alt={item.original_filename}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            {item.evidence_type === 'video' ? <Film className="w-8 h-8 mb-1" /> : <FileIcon className="w-8 h-8 mb-1" />}
                            <span className="text-xs truncate max-w-full px-2">{item.original_filename}</span>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                            href={`/api/v1/evidence/${item.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white text-xs hover:underline"
                        >
                            Visa
                        </a>
                    </div>
                </div>
            ))}
        </div>
    )
}
