
import { FileText, Download } from 'lucide-react'
import { Report, formatDate } from '@/types'

interface ReportListProps {
    reports: Report[]
    isLoading: boolean
}

export function ReportList({ reports, isLoading }: ReportListProps) {
    if (isLoading) {
        return <div className="text-center py-8 text-gray-500">Loading reports...</div>
    }

    if (reports.length === 0) {
        return (
            <div className="text-center py-12 bg-bg-secondary rounded-lg border border-dashed border-border">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No reports generated yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-border hover:border-text-secondary transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-bg-primary rounded border border-border">
                            <FileText className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 capitalize">
                                {report.variant} Report
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatDate(report.generated_at)} • {report.scope}
                            </p>
                        </div>
                    </div>

                    <a
                        href={report.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-white text-sm flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </a>
                </div>
            ))}
        </div>
    )
}
