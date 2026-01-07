'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi, speakersApi, CreateEventRequest, EventType, EventStatus, Speaker } from '@/lib/api';
import { VenueImagesSection } from '@/components/VenueImagesSection';
import { TicketTypesSection } from '@/components/TicketTypesSection';
import { SessionsSection } from '@/components/SessionsSection';
import { DescriptionWithAttachments, DescriptionWithAttachmentsRef } from '@/components/DescriptionWithAttachments';

// Steps for Single Room events (3 steps - no Sessions)
const STEPS_SINGLE = [
    { id: 1, title: 'Event Details', icon: 'ti-calendar-event' },
    { id: 2, title: 'Tickets', icon: 'ti-ticket' },
    { id: 3, title: 'Venue/Images', icon: 'ti-photo' },
];

// Steps for Multi Session events (4 steps)
const STEPS_MULTI = [
    { id: 1, title: 'Event Details', icon: 'ti-calendar-event' },
    { id: 2, title: 'Sessions', icon: 'ti-layout-grid' },
    { id: 3, title: 'Tickets', icon: 'ti-ticket' },
    { id: 4, title: 'Venue/Images', icon: 'ti-photo' },
];

// Speaker selection type
interface SelectedSpeaker {
    id: number;
    name: string;
    title: string | null;
    role: string;
}

export default function CreateEventPage() {
    const router = useRouter();

    // Wizard state
    const [currentStep, setCurrentStep] = useState(1);
    const [createdEventId, setCreatedEventId] = useState<number | null>(null);
    const descriptionRef = useRef<DescriptionWithAttachmentsRef>(null);

    // Form state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Speakers state
    const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
    const [selectedSpeakers, setSelectedSpeakers] = useState<SelectedSpeaker[]>([]);
    const [loadingSpeakers, setLoadingSpeakers] = useState(false);

    // Fetch available speakers on mount
    useEffect(() => {
        const fetchSpeakers = async () => {
            setLoadingSpeakers(true);
            try {
                const response = await speakersApi.list();
                if (response.success) {
                    setAvailableSpeakers(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch speakers:', err);
            } finally {
                setLoadingSpeakers(false);
            }
        };
        fetchSpeakers();
    }, []);

    const [formData, setFormData] = useState<CreateEventRequest>({
        eventCode: '',
        eventName: '',
        description: '',
        eventType: 'single_room',
        location: '',
        startDate: '',
        endDate: '',
        maxCapacity: 100,
        cpeCredits: '',
        imageUrl: '',
        mapUrl: '',
        status: 'draft',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxCapacity' ? parseInt(value) || 0 : value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                return data.data.url;
            }
            return null;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    };

    const handleSaveEvent = async () => {
        setError(null);
        setLoading(true);

        try {
            // Validate required fields
            if (!formData.eventCode || !formData.eventName || !formData.startDate || !formData.endDate) {
                setError('Please fill in all required fields');
                setLoading(false);
                return;
            }

            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                setError('Invalid date format');
                setLoading(false);
                return;
            }

            // Upload image first if selected
            let imageUrl = formData.imageUrl;
            if (imageFile) {
                setUploading(true);
                const uploadedUrl = await uploadImage(imageFile);
                setUploading(false);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            // Build submit data
            const submitData: CreateEventRequest = {
                eventCode: formData.eventCode,
                eventName: formData.eventName,
                eventType: formData.eventType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                maxCapacity: formData.maxCapacity,
                status: formData.status,
                description: formData.description || undefined,
                location: formData.location || undefined,
                mapUrl: formData.mapUrl || undefined,
                cpeCredits: formData.cpeCredits || undefined,
                imageUrl: imageUrl || undefined,
            };

            const response = await eventsApi.create(submitData);

            if (response.success && response.data) {
                const newEventId = response.data.id;

                // Upload attachments if any
                if (descriptionRef.current?.hasPendingFiles()) {
                    try {
                        await descriptionRef.current.uploadPendingFiles(newEventId);
                    } catch (err) {
                        console.error('Failed to upload attachments:', err);
                        // Convert unknown error to string for alert/notification
                        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                        alert(`Event created but failed to upload attachments: ${errorMessage}`);
                    }
                }

                // Add speakers to event
                if (selectedSpeakers.length > 0) {
                    const eventId = newEventId;
                    for (const speaker of selectedSpeakers) {
                        await speakersApi.addToEvent(eventId, speaker.id, speaker.role);
                    }
                }

                // Save event ID and go to next step
                setCreatedEventId(response.data.id);
                setCurrentStep(2);
            } else {
                setError('Failed to create event');
            }
        } catch (err) {
            console.error('Create event error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        router.push('/events');
    };

    // Get steps based on event type
    const isMultiSession = formData.eventType === 'multi_session';
    const steps = isMultiSession ? STEPS_MULTI : STEPS_SINGLE;
    const progressWidth = isMultiSession
        ? (currentStep - 1) * 26.67
        : (currentStep - 1) * 40;

    return (
        <>
            {/* Page Title */}
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box">
                        <div className="page-title-right">
                            <Link href="/events" className="btn btn-secondary">
                                <i className="ti ti-arrow-left me-1"></i> Back to Events
                            </Link>
                        </div>
                        <h4 className="page-title">Create New Event</h4>
                    </div>
                </div>
            </div>

            {/* Step Progress */}
            <div className="card mb-4">
                <div className="card-body py-4">
                    <div className="d-flex justify-content-between align-items-center position-relative">
                        {/* Progress Line */}
                        <div
                            className="position-absolute bg-light"
                            style={{
                                height: '4px',
                                left: '10%',
                                right: '10%',
                                top: '24px',
                                zIndex: 0
                            }}
                        ></div>
                        <div
                            className="position-absolute bg-success"
                            style={{
                                height: '4px',
                                left: '10%',
                                width: `${progressWidth}%`,
                                top: '24px',
                                zIndex: 1,
                                transition: 'width 0.3s ease'
                            }}
                        ></div>

                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className="text-center position-relative"
                                style={{ zIndex: 2, flex: 1 }}
                            >
                                <div
                                    className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${step.id < currentStep
                                        ? 'bg-success text-white'
                                        : step.id === currentStep
                                            ? 'bg-primary text-white'
                                            : 'bg-light text-muted'
                                        }`}
                                    style={{ width: '48px', height: '48px' }}
                                >
                                    {step.id < currentStep ? (
                                        <i className="ti ti-check" style={{ fontSize: '1.5rem' }}></i>
                                    ) : (
                                        <i className={`ti ${step.icon}`} style={{ fontSize: '1.5rem' }}></i>
                                    )}
                                </div>
                                <div className={step.id === currentStep ? 'text-primary fw-bold' : 'text-muted'}>
                                    {step.title}
                                </div>
                                {step.id < currentStep && (
                                    <small className="text-success d-block">Completed</small>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="row">
                <div className="col-lg-8 mx-auto">
                    {/* Step 1: Event Details */}
                    {currentStep === 1 && (
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <h5 className="card-title mb-0 text-white">
                                    <i className="ti ti-calendar-event me-2"></i>
                                    Step 1: Event Details
                                </h5>
                            </div>
                            <div className="card-body">
                                {error && (
                                    <div className="alert alert-danger">
                                        <i className="ti ti-alert-circle me-2"></i>{error}
                                    </div>
                                )}

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Event Code *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="eventCode"
                                                value={formData.eventCode}
                                                onChange={handleChange}
                                                placeholder="e.g., CONF2026"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Event Type</label>
                                            <select
                                                className="form-select"
                                                name="eventType"
                                                value={formData.eventType}
                                                onChange={handleChange}
                                            >
                                                <option value="single_room">Single Room</option>
                                                <option value="multi_session">Multi Session</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Event Name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="eventName"
                                        value={formData.eventName}
                                        onChange={handleChange}
                                        placeholder="Enter event name"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <DescriptionWithAttachments
                                        ref={descriptionRef}
                                        eventId={createdEventId || 0}
                                        description={formData.description || ''}
                                        onDescriptionChange={(val: string) => setFormData((prev: CreateEventRequest) => ({ ...prev, description: val }))}
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Start Date *</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">End Date *</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Location Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="e.g., ศูนย์ประชุมแห่งชาติสิริกิติ์"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Google Maps Link</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                name="mapUrl"
                                                value={formData.mapUrl || ''}
                                                onChange={handleChange}
                                                placeholder="https://maps.google.com/..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">Max Capacity</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="maxCapacity"
                                                value={formData.maxCapacity}
                                                onChange={handleChange}
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">CPE Credits</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="cpeCredits"
                                                value={formData.cpeCredits}
                                                onChange={handleChange}
                                                placeholder="e.g., 6.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="mb-3">
                                            <label className="form-label">Status</label>
                                            <select
                                                className="form-select"
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Cover Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageChange}
                                    />
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="img-thumbnail"
                                                style={{ maxHeight: '150px' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Speakers */}
                                <div className="mb-3">
                                    <label className="form-label">
                                        <i className="ti ti-users me-1"></i>Speakers
                                    </label>
                                    {selectedSpeakers.length > 0 && (
                                        <div className="mb-2">
                                            {selectedSpeakers.map((speaker, index) => (
                                                <span key={speaker.id} className="badge bg-primary me-2 mb-1">
                                                    {speaker.name}
                                                    <button
                                                        type="button"
                                                        className="btn-close btn-close-white ms-2"
                                                        style={{ fontSize: '0.5rem' }}
                                                        onClick={() => setSelectedSpeakers(prev => prev.filter((_, i) => i !== index))}
                                                    ></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <select
                                        className="form-select"
                                        value=""
                                        disabled={loadingSpeakers}
                                        onChange={(e) => {
                                            const speakerId = parseInt(e.target.value);
                                            const speaker = availableSpeakers.find(s => s.id === speakerId);
                                            if (speaker && !selectedSpeakers.some(s => s.id === speakerId)) {
                                                setSelectedSpeakers(prev => [...prev, {
                                                    id: speaker.id,
                                                    name: speaker.name,
                                                    title: speaker.title,
                                                    role: 'speaker'
                                                }]);
                                            }
                                        }}
                                    >
                                        <option value="">{loadingSpeakers ? 'Loading...' : '+ Add Speaker'}</option>
                                        {availableSpeakers
                                            .filter(s => !selectedSpeakers.some(sel => sel.id === s.id))
                                            .map(speaker => (
                                                <option key={speaker.id} value={speaker.id}>
                                                    {speaker.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <hr />
                                <div className="d-flex justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={handleSaveEvent}
                                        disabled={loading || uploading}
                                    >
                                        {loading || uploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                {uploading ? 'Uploading...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                Save & Continue
                                                <i className="ti ti-arrow-right ms-2"></i>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 for Multi-Session: Sessions */}
                    {currentStep === 2 && createdEventId && isMultiSession && (
                        <div className="card">
                            <div className="card-header bg-info text-white">
                                <h5 className="card-title mb-0 text-white">
                                    <i className="ti ti-layout-grid me-2"></i>
                                    Step 2: Sessions
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="alert alert-info mb-4">
                                    <i className="ti ti-info-circle me-2"></i>
                                    Add sessions for your multi-session event
                                </div>

                                <SessionsSection eventId={createdEventId} />

                                <hr />
                                <div className="d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        onClick={() => setCurrentStep(1)}
                                    >
                                        <i className="ti ti-arrow-left me-1"></i>
                                        Back to Event Details
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setCurrentStep(3)}
                                    >
                                        Continue
                                        <i className="ti ti-arrow-right ms-2"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tickets - Step 2 for Single Room, Step 3 for Multi Session */}
                    {((currentStep === 2 && !isMultiSession) || (currentStep === 3 && isMultiSession)) && createdEventId && (
                        <div className="card">
                            <div className="card-header bg-warning">
                                <h5 className="card-title mb-0">
                                    <i className="ti ti-ticket me-2"></i>
                                    Step {isMultiSession ? '3' : '2'}: Tickets
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="alert alert-info mb-4">
                                    <i className="ti ti-info-circle me-2"></i>
                                    Add ticket types for your event (e.g., Early Bird, Member, Public)
                                </div>

                                <TicketTypesSection eventId={createdEventId} />

                                <hr />
                                <div className="d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        onClick={() => setCurrentStep(isMultiSession ? 2 : 1)}
                                    >
                                        <i className="ti ti-arrow-left me-1"></i>
                                        Back to {isMultiSession ? 'Sessions' : 'Event Details'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setCurrentStep(isMultiSession ? 4 : 3)}
                                    >
                                        Continue
                                        <i className="ti ti-arrow-right ms-2"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Venue/Images - Step 3 for Single Room, Step 4 for Multi Session */}
                    {((currentStep === 3 && !isMultiSession) || (currentStep === 4 && isMultiSession)) && createdEventId && (
                        <div className="card">
                            <div className="card-header bg-success text-white">
                                <h5 className="card-title mb-0 text-white">
                                    <i className="ti ti-photo me-2"></i>
                                    Step {isMultiSession ? '4' : '3'}: Venue/Images
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="alert alert-info mb-4">
                                    <i className="ti ti-info-circle me-2"></i>
                                    Upload images of the venue (max 10 images)
                                </div>

                                <VenueImagesSection eventId={createdEventId} />

                                <hr />
                                <div className="d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-light"
                                        onClick={() => setCurrentStep(isMultiSession ? 3 : 2)}
                                    >
                                        <i className="ti ti-arrow-left me-1"></i>
                                        Back to Tickets
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-success btn-lg"
                                        onClick={handleFinish}
                                    >
                                        <i className="ti ti-check me-2"></i>
                                        Finish
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
