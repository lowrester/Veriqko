import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react'
import { api } from '@/api/client'
import { EvidenceGallery } from '../runner/components/EvidenceGallery'

// Types (should remain consistent with RunnerPage)
interface Step {
    id: string
    name: string
    status: 'pass' | 'fail' | 'skip' | 'pending'
    notes?: string
    evidence?: any[]
}

interface Job {
    id: string
    serial_number: string
    device_platform: string
    device_model: string
    status: string
}

export function QcPage() {
    const { id: jobId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [qcNotes, setQcNotes] = useState('')

    // Fetch job details
    const { data: job, isLoading: jobLoading } = useQuery<Job>({
        queryKey: ['job', jobId],
        queryFn: () => api.get(`/jobs/${jobId}`),
        enabled: !!jobId,
    })

    // Fetch steps
    const { data: steps = [], isLoading: stepsLoading } = useQuery<Step[]>({
        queryKey: ['job', jobId, 'steps'],
        queryFn: () => api.get(`/jobs/${jobId}/steps`),
        enabled: !!jobId,
    })

    // QC Decision Mutation
    const qcMutation = useMutation({
        mutationFn: ({ decision, notes }: { decision: 'approve' | 'reject', notes: string }) =>
            api.post(`/jobs/${jobId}/qc`, { decision, notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job', jobId] })
            navigate('/dashboard')
        }
    })

    if (jobLoading || stepsLoading || !job) {
        return <div className="text-center py-12">Laddar QC-data...</div>
    }

    const handleApprove = () => {
        if (window.confirm('Är du säker på att du vill godkänna detta jobb?')) {
            qcMutation.mutate({ decision: 'approve', notes: qcNotes })
        }
    }

    const handleReject = () => {
        if (!qcNotes.trim()) {
            alert('Du måste ange en anledning för avslag.')
            return
        }
        if (window.confirm('Detta skickar tillbaka jobbet till Intag/Reset. Är du säker?')) {
            qcMutation.mutate({ decision: 'reject', notes: qcNotes })
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard" className="btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="badge-purple text-xs uppercase tracking-wider">Quality Control</span>
                        <span className="text-gray-400">/</span>
                        <span className="font-mono text-gray-600 font-medium">{job.serial_number}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">
                        {job.device_platform} {job.device_model}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Test Results */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card">
                        <h2 className="font-semibold text-gray-900 mb-4">Testresultat</h2>
                        <div className="space-y-4">
                            {steps.map((step) => (
                                <div key={step.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">{step.name}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${step.status === 'pass' ? 'bg-green-100 text-green-700' :
                                            step.status === 'fail' ? 'bg-red-100 text-red-700' :
                                                step.status === 'skip' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-200 text-gray-600'
                                            }`}>
                                            {step.status}
                                        </span>
                                    </div>

                                    {step.notes && (
                                        <p className="text-sm text-gray-600 mb-2 bg-white p-2 rounded border border-gray-200">
                                            Notering: {step.notes}
                                        </p>
                                    )}

                                    {step.evidence && step.evidence.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-500 mb-1">Bevis:</p>
                                            <EvidenceGallery items={step.evidence} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Decision */}
                <div className="space-y-6">
                    <div className="card sticky top-20">
                        <h2 className="font-semibold text-gray-900 mb-4">Beslut</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="label">QC Noteringar *</label>
                                <textarea
                                    className="input min-h-[120px]"
                                    placeholder="Ange kommentarer här (krävs vid avslag)..."
                                    value={qcNotes}
                                    onChange={(e) => setQcNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={handleApprove}
                                    disabled={qcMutation.isPending}
                                    className="btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Godkänn Jobb
                                </button>

                                <button
                                    onClick={handleReject}
                                    disabled={qcMutation.isPending}
                                    className="btn bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Avslå & Returnera
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
