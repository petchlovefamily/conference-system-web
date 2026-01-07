'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { eventsApi, speakersApi, Event, EventType, EventStatus, Speaker } from '@/lib/api';
import { VenueImagesSection } from '@/components/VenueImagesSection';
import { TicketTypesSection } from '@/components/TicketTypesSection';
import { SessionsSection } from '@/components/SessionsSection';
import { DescriptionWithAttachments, DescriptionWithAttachmentsRef } from '@/components/DescriptionWithAttachments';

// Speaker selection type
interface SelectedSpeaker {
    id: number;
    name: string;
    title: string | null;
    role: string;
}

interface EditEventFormData {
    eventCode: string;
    eventName: string;
    description: string;
    eventType: EventType;
    location: string;
    startDate: string;
    endDate: string;
    maxCapacity: number;
    cpeCredits: string;
    imageUrl: string;
    mapUrl: string;
    status: EventStatus;
}

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const eventId = parseInt(params.id as string);
    const isNewEvent = searchParams.get('new') === 'true';

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Speakers state
    const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
    const [selectedSpeakers, setSelectedSpeakers] = useState<SelectedSpeaker[]>([]);
    const [loadingSpeakers, setLoadingSpeakers] = useState(false);
    const [speakersChanged, setSpeakersChanged] = useState(false);

    // Ref for attachments component
    const attachmentsRef = useRef<DescriptionWithAttachmentsRef>(null);

    // Track if form has been modified
    const [isFormDirty, setIsFormDirty] = useState(false);

    const [formData, setFormData] = useState<EditEventFormData>({
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

    // Fetch event data on mount
    useEffect(() => {
        const loadEvent = async () => {
            try {
                setFetching(true);
                const response = await eventsApi.get(eventId);
                if (response.success && response.data) {
                    const e = response.data;
                    setEvent(e);

                    const formatDate = (dateStr: string) => {
                        const d = new Date(dateStr);
                        return d.toISOString().slice(0, 16);
                    };

                    setFormData({
                        eventCode: e.eventCode,
                        eventName: e.eventName,
                        description: e.description || '',
                        eventType: e.eventType,
                        location: e.location || '',
                        startDate: formatDate(e.startDate),
                        endDate: formatDate(e.endDate),
                        maxCapacity: e.maxCapacity,
                        cpeCredits: e.cpeCredits || '',
                        imageUrl: e.imageUrl || '',
                        mapUrl: e.mapUrl || '',
                        status: e.status,
                    });

                    if ((e as any).speakers && Array.isArray((e as any).speakers)) {
                        setSelectedSpeakers((e as any).speakers.map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            title: s.title,
                            role: s.role || 'speaker'
                        })));
                    }
                } else {
                    setError('Event not found');
                }
            } catch (err) {
                console.error('Failed to load event:', err);
                setError(err instanceof Error ? err.message : 'Failed to load event');
            } finally {
                setFetching(false);
            }
        };

        if (eventId) {
            loadEvent();
        }
    }, [eventId]);

    // Fetch available speakers
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxCapacity' ? parseInt(value) || 0 : value,
        }));
        setIsFormDirty(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setIsFormDirty(true);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
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

            const submitData = {
                eventCode: formData.eventCode,
                eventName: formData.eventName,
                eventType: formData.eventType,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                maxCapacity: formData.maxCapacity,
                status: formData.status,
                description: formData.description || undefined,
                location: formData.location || undefined,
                cpeCredits: formData.cpeCredits || undefined,
                imageUrl: imageUrl || undefined,
                mapUrl: formData.mapUrl || undefined,
            };

            const response = await eventsApi.update(eventId, submitData);

            if (response.success) {
                // Update speakers if changed
                if (speakersChanged) {
                    // Remove all existing speakers
                    if (event && (event as any).speakers) {
                        for (const speaker of (event as any).speakers) {
                            await speakersApi.removeFromEvent(eventId, speaker.id);
                        }
                    }
                    // Add new speakers
                    for (const speaker of selectedSpeakers) {
                        await speakersApi.addToEvent(eventId, speaker.id, speaker.role);
                    }
                }

                // Upload pending attachments
                if (attachmentsRef.current?.hasPendingFiles()) {
                    await attachmentsRef.current.uploadPendingFiles();
                }

                setSuccess('Event updated successfully!');
                setImageFile(null);
                setIsFormDirty(false);
                setSpeakersChanged(false);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to update event');
            }
        } catch (err) {
            console.error('Update event error:', err);
            setError(err instanceof Error ? err.message : 'Failed to update event');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading event...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <i className="ti ti-alert-circle text-danger" style={{ fontSize: '4rem' }}></i>
                    <h4 className="mt-3">Event Not Found</h4>
                    <Link href="/events" className="btn btn-primary mt-3">
                        Back to Events
                    </Link>
                </div>
            </div>
        );
    }

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
                        <h4 className="page-title">Edit Event: {event.eventName}</h4>
                    </div>
                </div>
            </div>

            {/* Success/New Event Alert */}
            {(isNewEvent || success) && (
                <div className="alert alert-success mb-4">
                    <i className="ti ti-check me-2"></i>
                    {isNewEvent ? (
                        <>
                            <strong>Event created successfully!</strong>
                            <span className="ms-2">Now you can add tickets and venue images below.</span>
                        </>
                    ) : success}
                </div>
            )}

            <div className="row">
                <div className="col-lg-8">
                    {/* Section 1: Event Details */}
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0 text-white">
                                <i className="ti ti-calendar-event me-2"></i>
                                Event Details
                            </h5>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger">
                                    <i className="ti ti-alert-circle me-2"></i>{error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Event Code</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="eventCode"
                                                value={formData.eventCode}
                                                onChange={handleChange}
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
                                    <label className="form-label">Event Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="eventName"
                                        value={formData.eventName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <DescriptionWithAttachments
                                    ref={attachmentsRef}
                                    eventId={eventId}
                                    description={formData.description}
                                    onDescriptionChange={(value) => {
                                        setFormData(prev => ({ ...prev, description: value }));
                                        setIsFormDirty(true);
                                    }}
                                />

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Start Date</label>
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
                                            <label className="form-label">End Date</label>
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
                                                <option value="cancelled">Cancelled</option>
                                                <option value="completed">Completed</option>
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
                                    {(imagePreview || formData.imageUrl) && (
                                        <div className="mt-2">
                                            <img
                                                src={imagePreview || formData.imageUrl}
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
                                                        onClick={() => {
                                                            setSelectedSpeakers(prev => prev.filter((_, i) => i !== index));
                                                            setSpeakersChanged(true);
                                                        }}
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
                                                setSpeakersChanged(true);
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
                                <div className="d-flex gap-2">
                                    {(isFormDirty || speakersChanged || attachmentsRef.current?.hasPendingFiles()) && (
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading || uploading}
                                        >
                                            {loading || uploading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    {uploading ? 'Uploading...' : 'Saving...'}
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ti ti-device-floppy me-1"></i>
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <Link href="/events" className="btn btn-light">
                                        {isFormDirty || speakersChanged ? 'Cancel' : 'Back to Events'}
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Section 2: Ticket Types */}
                    <div className="mb-4">
                        <TicketTypesSection eventId={eventId} />
                    </div>

                    {/* Section 3: Sessions (only for multi_session events) */}
                    {formData.eventType === 'multi_session' && (
                        <div className="mb-4">
                            <SessionsSection eventId={eventId} />
                        </div>
                    )}

                    {/* Section 4: Venue Images */}
                    <div className="mb-4">
                        <VenueImagesSection eventId={eventId} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    <div className="card sticky-top" style={{ top: '20px' }}>
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="ti ti-info-circle me-2"></i>Quick Links
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <Link href={`/events/${eventId}`} className="btn btn-outline-primary">
                                    <i className="ti ti-eye me-2"></i>View Event
                                </Link>
                                <Link href={`/public/events/${eventId}`} className="btn btn-outline-success" target="_blank">
                                    <i className="ti ti-external-link me-2"></i>Public Page
                                </Link>
                            </div>

                            <hr />

                            <div className="text-muted small">
                                <p className="mb-2">
                                    <i className="ti ti-calendar me-1"></i>
                                    <strong>Created:</strong> {new Date(event.createdAt).toLocaleDateString('th-TH')}
                                </p>
                                <p className="mb-0">
                                    <i className="ti ti-id me-1"></i>
                                    <strong>Event ID:</strong> {eventId}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
