'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { eventsApi, sessionsApi, speakersApi, Session, CreateSessionRequest, Speaker } from '@/lib/api';

export default function SessionsPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = parseInt(params.id as string);

    const [eventName, setEventName] = useState('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [speakersList, setSpeakersList] = useState<Speaker[]>([]);
    const [selectedSpeakerIds, setSelectedSpeakerIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [formData, setFormData] = useState<CreateSessionRequest>({
        sessionCode: '',
        sessionName: '',
        description: '',
        room: '',
        startTime: '',
        endTime: '',
        speakers: '',
        maxCapacity: 50,
    });

    useEffect(() => {
        loadData();
    }, [eventId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [eventRes, sessionsRes, speakersRes] = await Promise.all([
                eventsApi.get(eventId),
                sessionsApi.list(eventId),
                speakersApi.list(),
            ]);
            if (eventRes.success && eventRes.data) {
                setEventName(eventRes.data.eventName);
            }
            if (sessionsRes.success) {
                setSessions(sessionsRes.data);
            }
            if (speakersRes.success) {
                setSpeakersList(speakersRes.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            sessionCode: '',
            sessionName: '',
            description: '',
            room: '',
            startTime: '',
            endTime: '',
            speakers: '',
            maxCapacity: 50,
        });
        setEditingSession(null);
        setShowForm(false);
    };

    const handleEdit = (session: Session) => {
        setEditingSession(session);
        setFormData({
            sessionCode: session.sessionCode,
            sessionName: session.sessionName,
            description: session.description || '',
            room: session.room || '',
            startTime: new Date(session.startTime).toISOString().slice(0, 16),
            endTime: new Date(session.endTime).toISOString().slice(0, 16),
            speakers: session.speakers || '',
            maxCapacity: session.maxCapacity,
        });

        // Parse speakers if it is JSON array of IDs
        try {
            if (session.speakers && session.speakers.startsWith('[')) {
                const ids = JSON.parse(session.speakers);
                if (Array.isArray(ids)) {
                    setSelectedSpeakerIds(ids);
                }
            } else {
                setSelectedSpeakerIds([]);
            }
        } catch (e) {
            setSelectedSpeakerIds([]);
        }

        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = { ...formData, speakers: JSON.stringify(selectedSpeakerIds) };
            if (editingSession) {
                await sessionsApi.update(eventId, editingSession.id, payload);
            } else {
                await sessionsApi.create(eventId, payload);
            }
            await loadData();
            resetForm();
        } catch (error) {
            console.error('Failed to save session:', error);
            alert('Failed to save session');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (sessionId: number) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            await sessionsApi.delete(eventId, sessionId);
            await loadData();
        } catch (error) {
            console.error('Failed to delete session:', error);
            alert('Failed to delete session');
        }
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('th-TH', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
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
                            <Link href={`/events/${eventId}/edit`} className="btn btn-light me-2">
                                <i className="ti ti-arrow-left me-1"></i>
                                Back to Event
                            </Link>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowForm(true)}
                            >
                                <i className="ti ti-plus me-1"></i>
                                Add Session
                            </button>
                        </div>
                        <h4 className="page-title">
                            <i className="ti ti-calendar-event me-2"></i>
                            Sessions: {eventName}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Session Form */}
            {showForm && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h4 className="card-title mb-0">
                                    {editingSession ? 'Edit Session' : 'Add New Session'}
                                </h4>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <label className="form-label">Session Code *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.sessionCode}
                                                onChange={(e) => setFormData({ ...formData, sessionCode: e.target.value })}
                                                placeholder="S01"
                                                required
                                            />
                                        </div>
                                        <div className="col-md-9">
                                            <label className="form-label">Session Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.sessionName}
                                                onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
                                                placeholder="Opening Ceremony"
                                                required
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Room</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.room}
                                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                                placeholder="Grand Hall"
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Start Time *</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">End Time *</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label">Speakers</label>
                                            <div className="card border p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {speakersList.length === 0 ? (
                                                    <div className="text-muted small">No speakers available. Please add speakers first.</div>
                                                ) : (
                                                    <div className="row g-2">
                                                        {speakersList.map(speaker => (
                                                            <div className="col-md-4" key={speaker.id}>
                                                                <div className="form-check">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`speaker-${speaker.id}`}
                                                                        checked={selectedSpeakerIds.includes(speaker.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setSelectedSpeakerIds([...selectedSpeakerIds, speaker.id]);
                                                                            } else {
                                                                                setSelectedSpeakerIds(selectedSpeakerIds.filter(id => id !== speaker.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <label className="form-check-label d-flex align-items-center" htmlFor={`speaker-${speaker.id}`}>
                                                                        {speaker.imageUrl && (
                                                                            <img src={speaker.imageUrl} alt="" className="rounded-circle me-1" width="20" height="20" />
                                                                        )}
                                                                        <span className="text-truncate" title={speaker.name}>
                                                                            {speaker.name}
                                                                        </span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Max Capacity</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={formData.maxCapacity}
                                                onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="col-12">
                                            <button type="submit" className="btn btn-primary me-2" disabled={saving}>
                                                {saving ? (
                                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                                ) : (
                                                    <i className="ti ti-check me-1"></i>
                                                )}
                                                {editingSession ? 'Update Session' : 'Add Session'}
                                            </button>
                                            <button type="button" className="btn btn-light" onClick={resetForm}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sessions List */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            {sessions.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="ti ti-calendar-off text-muted" style={{ fontSize: '3rem' }}></i>
                                    <p className="text-muted mt-2">No sessions yet</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Session Name</th>
                                                <th>Room</th>
                                                <th>Time</th>
                                                <th>Speakers</th>
                                                <th>Capacity</th>
                                                <th style={{ width: '120px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sessions.map((session) => (
                                                <tr key={session.id}>
                                                    <td>
                                                        <code>{session.sessionCode}</code>
                                                    </td>
                                                    <td>
                                                        <strong>{session.sessionName}</strong>
                                                        {session.description && (
                                                            <small className="d-block text-muted">{session.description}</small>
                                                        )}
                                                    </td>
                                                    <td>{session.room || '-'}</td>
                                                    <td>
                                                        <small>
                                                            {formatDateTime(session.startTime)}
                                                            <br />
                                                            to {formatDateTime(session.endTime)}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {(() => {
                                                            if (!session.speakers) return '-';
                                                            try {
                                                                if (session.speakers.startsWith('[')) {
                                                                    const ids = JSON.parse(session.speakers);
                                                                    if (Array.isArray(ids)) {
                                                                        const names = ids.map(id => {
                                                                            const s = speakersList.find(sp => sp.id === id);
                                                                            return s ? s.name : null;
                                                                        }).filter(Boolean);
                                                                        return names.join(', ');
                                                                    }
                                                                }
                                                                return session.speakers;
                                                            } catch (e) {
                                                                return session.speakers;
                                                            }
                                                        })()}
                                                    </td>
                                                    <td>{session.maxCapacity}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-light me-1"
                                                            onClick={() => handleEdit(session)}
                                                        >
                                                            <i className="ti ti-pencil"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDelete(session.id)}
                                                        >
                                                            <i className="ti ti-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
