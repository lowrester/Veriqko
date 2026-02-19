import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { ArrowLeft, Save, Layers, Smartphone, AlertOctagon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PrintLabelModal } from '../printing/components/PrintLabelModal'
import { useToastStore } from '@/stores/toastStore'

export function IntakeNewPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        serial_number: '',
        imei: '',
        brand: '',
        device_type: '',
        model: '',
        customer_reference: '',
        batch_id: '',
        condition_notes: '',
    })
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [createdJob, setCreatedJob] = useState<any>(null)
    const [submitAction, setSubmitAction] = useState<'create' | 'create_print'>('create')
    const [isBatchMode, setIsBatchMode] = useState(false)
    const [serialList, setSerialList] = useState('')

    const [imeiSecurity, setImeiSecurity] = useState<{ is_blacklisted: boolean, reason?: string } | null>(null)

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/jobs', data),
        onSuccess: (job: any) => {
            if (submitAction === 'create_print') {
                setCreatedJob(job)
                setShowPrintModal(true)
            } else {
                navigate(`/job/${job.id}/run`)
            }
        },
    })

    const handleSubmit = (action: 'create' | 'create_print') => (e: React.MouseEvent) => {
        e.preventDefault()
        setSubmitAction(action)

        if (isBatchMode) {
            const sns = serialList.split('\n').map(s => s.trim()).filter(s => s.length > 0)
            if (sns.length === 0) return

            const batchData = {
                serial_numbers: sns,
                batch_id: formData.batch_id,
                customer_reference: formData.customer_reference,
                common_data: {
                    ...formData,
                    serial_number: undefined, // removed from common
                }
            }
            api.post('/jobs/batch', batchData).then((data: any) => {
                const jobs = data as any[]
                const toast = useToastStore.getState().addToast
                toast(`${jobs.length} jobb har skapats.`, 'success')
                navigate('/dashboard')
            })
        } else {
            createMutation.mutate(formData)
        }
    }

    const checkImei = async (imei: string) => {
        if (imei.length < 8) {
            setImeiSecurity(null)
            return
        }
        try {
            const data = await api.get(`/jobs/security/check-imei/${imei}`)
            setImeiSecurity(data as { is_blacklisted: boolean, reason?: string })
        } catch (e) {
            console.error("IMEI check failed", e)
        }
    }

    const handlePrintClose = () => {
        setShowPrintModal(false)
        if (createdJob) {
            navigate(`/job/${createdJob.id}/run`)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/dashboard" className="btn-secondary">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Job Intake</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Register device and start verification</p>
                </div>
                <div className="ml-auto flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setIsBatchMode(false)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!isBatchMode ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-primary' : 'text-gray-500'}`}
                    >
                        <Smartphone className="w-4 h-4" />
                        Single
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsBatchMode(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isBatchMode ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-primary' : 'text-gray-500'}`}
                    >
                        <Layers className="w-4 h-4" />
                        Batch
                    </button>
                </div>
            </div>

            <form className="card space-y-4">
                <div>
                    <label className="label">{isBatchMode ? 'Serial Numbers (One per line) *' : 'Serial Number *'}</label>
                    {isBatchMode ? (
                        <textarea
                            required
                            value={serialList}
                            onChange={(e) => setSerialList(e.target.value)}
                            className="input min-h-[120px]"
                            placeholder="Scan multiple serials here..."
                        />
                    ) : (
                        <input
                            type="text"
                            required
                            value={formData.serial_number}
                            onChange={(e) =>
                                setFormData({ ...formData, serial_number: e.target.value })
                            }
                            className="input"
                            placeholder="e.g. ABC123456"
                        />
                    )}
                </div>

                <div>
                    <label className="label">IMEI (Mobile/Tablet)</label>
                    <input
                        type="text"
                        value={formData.imei}
                        onChange={(e) => {
                            const val = e.target.value
                            setFormData({ ...formData, imei: val })
                            checkImei(val)
                        }}
                        className={`input ${imeiSecurity?.is_blacklisted ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="e.g. 3548..."
                    />
                    {imeiSecurity?.is_blacklisted && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-800">
                            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="font-bold">IMEI BLACKLIST HIT</p>
                                <p>{imeiSecurity.reason || 'Device reported as stolen or locked.'}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="label">Brand *</label>
                    <input
                        type="text"
                        required
                        value={formData.brand}
                        onChange={(e) =>
                            setFormData({ ...formData, brand: e.target.value })
                        }
                        className="input"
                        placeholder="e.g. Apple"
                    />
                </div>

                <div>
                    <label className="label">Device Type *</label>
                    <select
                        required
                        value={formData.device_type}
                        onChange={(e) =>
                            setFormData({ ...formData, device_type: e.target.value })
                        }
                        className="input"
                    >
                        <option value="">Select Type</option>
                        <option value="Mobile">Mobile Phone</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Console">Games Console</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="label">Model *</label>
                    <input
                        type="text"
                        required
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="input"
                        placeholder="e.g. iPhone 13"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Customer Reference</label>
                        <input
                            type="text"
                            value={formData.customer_reference}
                            onChange={(e) =>
                                setFormData({ ...formData, customer_reference: e.target.value })
                            }
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Batch ID</label>
                        <input
                            type="text"
                            value={formData.batch_id}
                            onChange={(e) =>
                                setFormData({ ...formData, batch_id: e.target.value })
                            }
                            className="input"
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Condition Notes (Intake)</label>
                    <textarea
                        value={formData.condition_notes}
                        onChange={(e) =>
                            setFormData({ ...formData, condition_notes: e.target.value })
                        }
                        className="input"
                        rows={3}
                        placeholder="Describe initial device condition..."
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit('create')}
                        disabled={createMutation.isPending}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {createMutation.isPending && submitAction === 'create' ? 'Creating...' : 'Create Job'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit('create_print')}
                        disabled={createMutation.isPending || isBatchMode}
                        className={`btn-secondary flex items-center gap-2 border-brand-primary text-brand-primary hover:bg-brand-light ${isBatchMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Save className="w-4 h-4" />
                        Create & Print Label
                    </button>

                    <Link to="/dashboard" className="btn-secondary ml-auto">
                        Cancel
                    </Link>
                </div>

                {createMutation.isError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        An error occurred. Please try again.
                    </div>
                )}
            </form>

            {createdJob && (
                <PrintLabelModal
                    isOpen={showPrintModal}
                    onClose={handlePrintClose}
                    context={{
                        id: createdJob.id,
                        serial_number: createdJob.serial_number,
                        imei: createdJob.imei || formData.imei,
                        brand: createdJob.device?.brand || formData.brand,
                        device_type: createdJob.device?.device_type || formData.device_type,
                        model: createdJob.device?.model || formData.model
                    }}
                />
            )}
        </div>
    )
}
